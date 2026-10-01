import pg from "pg";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING;

// OpenAI models per job type.
const RECIPE_MODEL = "gpt-6.1-sol";
const CATEGORISE_MODEL = "gpt-6-luna";

const RECIPE_MAX_OUTPUT_TOKENS = 50000;
const CATEGORISE_MAX_OUTPUT_TOKENS = 8000;

// Defensive cap; the API already limits categorise jobs to this many items.
const CATEGORISE_MAX_ITEMS = 300;

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
      "instructions": "1. First step\\n2. Second step\\n3. Third step",
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
- Instructions MUST be formatted with numbered steps, each step separated by TWO newlines (\\n). Example: "1. Do this\\n2. Do that\\n3. Then this"
- Instructions should be detailed and in the same language as the user's request
- Recipe names should be in the same language as the user's request
- If the user asks to modify a recipe, return the modified version
- Always return valid JSON, nothing else`;

const CATEGORISE_SYSTEM_PROMPT = `You are a shopping assistant. You sort grocery and household shopping list items
into the user's own shopping categories (for example supermarket sections such as dairy, bakery or cleaning products).

You will receive JSON with a list of categories and a list of items, each identified by a numeric index.
Category names and item names may be in Lithuanian or English, or a mix of both.

For EVERY item, choose the single category that fits it best:
- Judge by what the product is, not only by matching words. For example "pienas" (milk) belongs in a dairy category
  and "obuoliai" (apples) in a fruit or vegetables category.
- If no category reasonably fits an item, use null for that item. Do not force a poor match.
- Refer to items and categories ONLY by their numeric index.

ALWAYS respond with valid JSON matching this exact schema:
{"assignments":[{"item":0,"category":2},{"item":1,"category":null}]}

Rules:
- "item" must be an item index from the input.
- "category" must be a category index from the input, or null.
- Include each item exactly once.
- Always return valid JSON, nothing else`;

/**
 * SQS handler — processes AI jobs: recipe generation ("text" / "image") and
 * shopping list categorisation ("categorise").
 */
export const handler = async (event) => {
  for (const record of event.Records) {
    const body = JSON.parse(record.body);
    const jobId = body.jobId;
    const jobType = body.type ?? "text";
    console.log(`[AiProcessor] Processing job ${jobId} (type: ${jobType})`);

    const pool = new pg.Pool(parseNpgsqlConnectionString(DB_CONNECTION_STRING));

    try {
      if (jobType === "categorise") {
        await processCategoriseJob(pool, jobId);
      } else {
        await processRecipeJob(pool, jobId, jobType);
      }
    } catch (error) {
      console.error(`[AiProcessor] Job ${jobId} failed:`, error.message);
      await failJob(pool, jobId, error);
    } finally {
      await pool.end();
    }
  }
};

/**
 * Recipe generation from a conversation (with optional recipe URL) or from an image.
 */
async function processRecipeJob(pool, jobId, jobType) {
  // Fetch job from DB.
  const jobResult = await pool.query(
    "SELECT id, request_body, image_base64 FROM ai_recipe_jobs WHERE id = $1 AND status = 'pending'",
    [jobId],
  );

  if (jobResult.rows.length === 0) {
    console.log(`[AiProcessor] Job ${jobId} not found or not pending, skipping.`);
    return;
  }

  const messages = jobResult.rows[0].request_body;
  const imageBase64 = jobResult.rows[0].image_base64;

  let input;

  if (jobType === "image" && imageBase64) {
    // Image-based recipe extraction.
    const mediaType = imageBase64.startsWith("/9j/") ? "image/jpeg" : "image/png";
    input = [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Extract the recipe from this image. Respond in JSON format. Identify all ingredients with quantities and provide step-by-step instructions.",
          },
          {
            type: "input_image",
            image_url: `data:${mediaType};base64,${imageBase64}`,
          },
        ],
      },
    ];
  } else {
    // Text-based recipe generation.
    input = [{ role: "user", content: "Respond in JSON format." }];
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
  }

  const outputText = await callOpenAiJson({
    model: RECIPE_MODEL,
    instructions: SYSTEM_PROMPT,
    input,
    maxOutputTokens: RECIPE_MAX_OUTPUT_TOKENS,
  });

  const jsonContent = extractJson(outputText);
  const parsed = JSON.parse(jsonContent);

  const result = {
    recipes: parsed.recipes ?? [],
    message: parsed.message ?? "",
    assistantMessage: outputText,
  };

  await completeJob(pool, jobId, result);

  console.log(`[AiProcessor] Job ${jobId} completed with ${result.recipes.length} recipes.`);
}

/**
 * Shopping list categorisation: assigns each item to one of the family's categories
 * and stores the result in the family-level shopping_item_categories memory.
 */
async function processCategoriseJob(pool, jobId) {
  const jobResult = await pool.query(
    "SELECT id, family_id, request_body FROM ai_recipe_jobs WHERE id = $1 AND status = 'pending' AND job_type = 'categorise'",
    [jobId],
  );

  if (jobResult.rows.length === 0) {
    console.log(`[AiProcessor] Job ${jobId} not found or not pending, skipping.`);
    return;
  }

  const familyId = jobResult.rows[0].family_id;
  const { categories, items } = readCategoriseRequest(jobResult.rows[0].request_body);

  if (categories.length === 0 || items.length === 0) {
    await completeJob(pool, jobId, { assigned: 0 });
    console.log(`[AiProcessor] Job ${jobId} completed: nothing to categorise.`);
    return;
  }

  const outputText = await callOpenAiJson({
    model: CATEGORISE_MODEL,
    instructions: CATEGORISE_SYSTEM_PROMPT,
    input: [
      {
        role: "user",
        content:
          "Assign each item to the best-fitting category. Respond in JSON format.\n\n" +
          JSON.stringify({
            categories: categories.map((c, index) => ({ index, name: c.name })),
            items: items.map((item, index) => ({ index, name: item.name })),
          }),
      },
    ],
    maxOutputTokens: CATEGORISE_MAX_OUTPUT_TOKENS,
  });

  const parsed = JSON.parse(extractJson(outputText));
  const { assignedKeys, assignedCategoryIds, clearedKeys } = parseAssignments(parsed, categories, items);

  const assigned = await saveCategoryAssignments(pool, familyId, assignedKeys, assignedCategoryIds, clearedKeys);

  await completeJob(pool, jobId, { assigned });

  console.log(
    `[AiProcessor] Job ${jobId} completed: ${assigned} of ${items.length} items assigned, ${clearedKeys.length} without a fitting category.`,
  );
}

/**
 * Reads the categorise job request body ({ categories: [{ id, name }], items: [{ key, name }] }),
 * dropping malformed entries.
 */
function readCategoriseRequest(requestBody) {
  const isNonEmptyString = (value) => typeof value === "string" && value.trim() !== "";

  const categories = (Array.isArray(requestBody?.categories) ? requestBody.categories : [])
    .filter((c) => isNonEmptyString(c?.id) && isNonEmptyString(c?.name));

  const items = (Array.isArray(requestBody?.items) ? requestBody.items : [])
    .filter((i) => isNonEmptyString(i?.key) && isNonEmptyString(i?.name))
    .slice(0, CATEGORISE_MAX_ITEMS);

  return { categories, items };
}

/**
 * Strictly validates the model output ({"assignments":[{"item":0,"category":2}, ...]}).
 * Only integer indices in range are accepted; anything else is ignored. The first
 * valid assignment for an item key wins. Items the model did not mention are left
 * untouched; items explicitly mapped to null are returned as cleared.
 */
function parseAssignments(parsed, categories, items) {
  const assignments = Array.isArray(parsed?.assignments) ? parsed.assignments : [];
  const isIndex = (value, length) => Number.isInteger(value) && value >= 0 && value < length;

  const seenKeys = new Set();
  const assignedKeys = [];
  const assignedCategoryIds = [];
  const clearedKeys = [];

  for (const assignment of assignments) {
    if (!isIndex(assignment?.item, items.length)) continue;

    const category = assignment.category;
    if (category !== null && !isIndex(category, categories.length)) continue;

    const key = items[assignment.item].key;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    if (category === null) {
      clearedKeys.push(key);
    } else {
      assignedKeys.push(key);
      assignedCategoryIds.push(categories[category].id);
    }
  }

  return { assignedKeys, assignedCategoryIds, clearedKeys };
}

/**
 * Writes the AI assignments in a single statement:
 * - upserts source='ai' mappings, never overwriting manual ones, and only for categories
 *   that still exist in the family (one may be deleted while the job runs; FOR KEY SHARE
 *   makes a concurrent delete either wait for us or be seen as gone);
 * - removes existing source='ai' mappings for items the model left without a category.
 * Item keys are re-normalised in SQL with lower(btrim(...)), matching the API.
 * Returns the number of mappings written.
 */
async function saveCategoryAssignments(pool, familyId, assignedKeys, assignedCategoryIds, clearedKeys) {
  const result = await pool.query(
    `WITH input AS (
       SELECT DISTINCT ON (lower(btrim(i.item_key))) lower(btrim(i.item_key)) AS item_key, i.category_id
       FROM unnest($2::text[], $3::uuid[]) AS i(item_key, category_id)
       WHERE lower(btrim(i.item_key)) <> ''
       ORDER BY lower(btrim(i.item_key))
     ),
     valid AS (
       SELECT input.item_key, sc.id AS category_id
       FROM input
       JOIN shopping_categories sc ON sc.id = input.category_id AND sc.family_id = $1::uuid
       FOR KEY SHARE OF sc
     ),
     cleared AS (
       DELETE FROM shopping_item_categories sic
       WHERE sic.family_id = $1::uuid
         AND sic.source = 'ai'
         AND sic.item_key IN (SELECT lower(btrim(k)) FROM unnest($4::text[]) AS k)
         AND sic.item_key NOT IN (SELECT item_key FROM input)
       RETURNING 1
     ),
     upserted AS (
       INSERT INTO shopping_item_categories (family_id, item_key, category_id, source, updated_at)
       SELECT $1::uuid, valid.item_key, valid.category_id, 'ai', now()
       FROM valid
       ON CONFLICT (family_id, item_key) DO UPDATE
       SET category_id = EXCLUDED.category_id, source = 'ai', updated_at = now()
       WHERE shopping_item_categories.source <> 'manual'
       RETURNING 1
     )
     SELECT (SELECT count(*) FROM upserted)::int AS assigned, (SELECT count(*) FROM cleared)::int AS cleared`,
    [familyId, assignedKeys, assignedCategoryIds, clearedKeys],
  );

  return result.rows[0].assigned;
}

/**
 * Calls the OpenAI Responses API in JSON mode and returns the output text.
 */
async function callOpenAiJson({ model, instructions, input, maxOutputTokens }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
      text: { format: { type: "json_object" } },
      max_output_tokens: maxOutputTokens,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API returned ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  if (data.status === "incomplete") {
    console.warn(`[AiProcessor] OpenAI response incomplete (${model}):`, data.incomplete_details?.reason);
  }

  const outputText = data.output_text ?? extractOutputText(data);

  if (!outputText) {
    throw new Error("Empty response from OpenAI.");
  }

  return outputText;
}

async function completeJob(pool, jobId, result) {
  await pool.query(
    "UPDATE ai_recipe_jobs SET status = 'completed', response_body = $1::jsonb, completed_at = now() WHERE id = $2",
    [JSON.stringify(result), jobId],
  );
}

async function failJob(pool, jobId, error) {
  await pool.query(
    "UPDATE ai_recipe_jobs SET status = 'failed', error = $1, completed_at = now() WHERE id = $2",
    [error.message, jobId],
  ).catch(() => {});
}

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
