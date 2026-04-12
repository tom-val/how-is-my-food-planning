import pg from "pg";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING;

/**
 * Parse an Npgsql-style connection string into pg Pool config.
 * Format: "Host=...;Port=...;Database=...;Username=...;Password=...;SSL Mode=Require;..."
 */
function parseNpgsqlConnectionString(connStr) {
  const params = {};
  for (const part of connStr.split(";")) {
    const eqIdx = part.indexOf("=");
    if (eqIdx < 0) continue;
    const key = part.slice(0, eqIdx).trim().toLowerCase();
    const value = part.slice(eqIdx + 1).trim();
    params[key] = value;
  }

  return {
    host: params.host,
    port: parseInt(params.port || "5432", 10),
    database: params.database,
    user: params.username,
    password: params.password,
    ssl: params["ssl mode"]?.toLowerCase() === "require" ? { rejectUnauthorized: false } : false,
  };
}

const SYSTEM_PROMPT = `You are a cooking assistant. The user will describe a dish or type of food they want,
or page content from a recipe URL will be provided.

WHEN PAGE CONTENT IS PROVIDED:
- Extract the EXACT recipe from the provided content.
- Do NOT make up or guess the recipe. Use the EXACT ingredients, quantities, and instructions from the provided content.
- If the content is structured data (JSON-LD), parse it accurately.
- If the page is in Lithuanian, keep the recipe in Lithuanian.
- Return exactly 1 recipe matching what is on the page.

WHEN A DISH NAME IS PROVIDED:
- Suggest 1-3 recipe variations.
- Be creative but accurate with ingredients and quantities.

ALWAYS respond with valid JSON matching this exact schema:
{
  "recipes": [
    {
      "name": "Recipe name",
      "instructions": "Step by step instructions...",
      "categories": ["breakfast", "lunch", "dinner", "snack"],
      "ingredients": [
        { "name": "Ingredient", "quantity": 1.0, "unit": "kg" }
      ]
    }
  ],
  "message": "Brief friendly message about the suggestions"
}

Rules:
- categories must only contain: "breakfast", "lunch", "dinner", "snack"
- Leave categories empty [] if the dish suits any meal
- quantity can be null if not applicable
- unit can be null if not applicable
- Instructions should be detailed and in the same language as the user's request
- Recipe names should be in the same language as the user's request
- If the user asks to modify a recipe, return the modified version
- Always return valid JSON, nothing else`;

/**
 * SQS handler — processes AI recipe generation jobs.
 */
export const handler = async (event) => {
  for (const record of event.Records) {
    const { jobId } = JSON.parse(record.body);
    console.log(`[AiProcessor] Processing job ${jobId}`);

    const pool = new pg.Pool(parseNpgsqlConnectionString(DB_CONNECTION_STRING));

    try {
      // Fetch job from DB.
      const jobResult = await pool.query(
        "SELECT id, request_body FROM ai_recipe_jobs WHERE id = $1 AND status = 'pending'",
        [jobId],
      );

      if (jobResult.rows.length === 0) {
        console.log(`[AiProcessor] Job ${jobId} not found or not pending, skipping.`);
        continue;
      }

      const messages = jobResult.rows[0].request_body;

      // Process messages — fetch URLs if present.
      const input = [{ role: "user", content: "Respond in JSON format." }];
      for (const msg of messages) {
        let content = msg.content;
        if (msg.role === "user") {
          const url = extractUrl(content);
          if (url) {
            const pageContent = await fetchPageContent(url);
            if (pageContent) {
              content = `Extract the recipe from this page: ${url}\n\n--- PAGE CONTENT ---\n${pageContent}\n--- END PAGE CONTENT ---`;
            }
          }
        }
        input.push({ role: msg.role, content });
      }

      // Call OpenAI Responses API.
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.4",
          instructions: SYSTEM_PROMPT,
          input,
          text: { format: { type: "json_object" } },
          max_output_tokens: 50000,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API returned ${response.status}: ${errorBody}`);
      }

      const data = await response.json();
      const outputText = data.output_text ?? extractOutputText(data);

      if (!outputText) {
        throw new Error("Empty response from OpenAI.");
      }

      const jsonContent = extractJson(outputText);
      const parsed = JSON.parse(jsonContent);

      const result = {
        recipes: parsed.recipes ?? [],
        message: parsed.message ?? "",
        assistantMessage: outputText,
      };

      // Update job as completed.
      await pool.query(
        "UPDATE ai_recipe_jobs SET status = 'completed', response_body = $1::jsonb, completed_at = now() WHERE id = $2",
        [JSON.stringify(result), jobId],
      );

      console.log(`[AiProcessor] Job ${jobId} completed with ${result.recipes.length} recipes.`);
    } catch (error) {
      console.error(`[AiProcessor] Job ${jobId} failed:`, error.message);

      await pool.query(
        "UPDATE ai_recipe_jobs SET status = 'failed', error = $1, completed_at = now() WHERE id = $2",
        [error.message, jobId],
      ).catch(() => {});
    } finally {
      await pool.end();
    }
  }
};

function extractUrl(text) {
  const words = text.split(/[\s\n\t]+/);
  return words.find((w) => w.startsWith("http://") || w.startsWith("https://")) ?? null;
}

async function fetchPageContent(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FoodPlanningBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();

    // Try JSON-LD first.
    const jsonLd = extractJsonLd(html);
    if (jsonLd) {
      console.log(`[AiProcessor] Found JSON-LD recipe data from ${url}`);
      return `STRUCTURED RECIPE DATA (JSON-LD):\n${jsonLd}`;
    }

    // Fall back to stripped HTML.
    console.log(`[AiProcessor] No JSON-LD found, using raw HTML from ${url}`);
    const cleaned = stripHtmlNoise(html);
    return cleaned.length > 15000 ? cleaned.slice(0, 15000) : cleaned;
  } catch (error) {
    console.warn(`[AiProcessor] Error fetching URL ${url}:`, error.message);
    return null;
  }
}

function extractJsonLd(html) {
  const regex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1].includes("Recipe")) {
      return match[1].trim();
    }
  }
  return null;
}

function stripHtmlNoise(html) {
  let result = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  result = result.replace(/<[^>]+>/g, " ");
  result = result.replace(/\s+/g, " ");
  return result.trim();
}

function extractOutputText(data) {
  if (data.output && Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item.type === "message" && Array.isArray(item.content)) {
        for (const part of item.content) {
          if (part.type === "output_text" && part.text) {
            return part.text;
          }
        }
      }
    }
  }
  return null;
}

function extractJson(text) {
  const trimmed = text.trim();

  const jsonStart = trimmed.indexOf("```json");
  if (jsonStart >= 0) {
    const contentStart = trimmed.indexOf("\n", jsonStart) + 1;
    const contentEnd = trimmed.indexOf("```", contentStart);
    if (contentEnd > contentStart) return trimmed.slice(contentStart, contentEnd).trim();
  }

  const fenceStart = trimmed.indexOf("```");
  if (fenceStart >= 0) {
    const contentStart = trimmed.indexOf("\n", fenceStart) + 1;
    const contentEnd = trimmed.indexOf("```", contentStart);
    if (contentEnd > contentStart) return trimmed.slice(contentStart, contentEnd).trim();
  }

  const braceStart = trimmed.indexOf("{");
  const braceEnd = trimmed.lastIndexOf("}");
  if (braceStart >= 0 && braceEnd > braceStart) return trimmed.slice(braceStart, braceEnd + 1);

  return trimmed;
}
