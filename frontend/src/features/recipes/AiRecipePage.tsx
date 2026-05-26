import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { aiStartJob, aiPollJob } from "../../api/recipeApi";
import type { AiMessage, AiSuggestedRecipe } from "../../api/recipeApi";
import { Icon } from "../../components/sage/Icon";
import { Spinner } from "../../components/sage/Spinner";
import { Modal } from "../../components/sage/Modal";

interface ChatEntry {
  role: "user" | "assistant";
  content: string;
  recipes?: AiSuggestedRecipe[];
}

export default function AiRecipePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [apiMessages, setApiMessages] = useState<AiMessage[]>([]);
  const [previewRecipe, setPreviewRecipe] = useState<AiSuggestedRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = (jobId: string, sentMessages: AiMessage[]) => {
    pollRef.current = setInterval(async () => {
      try {
        const job = await aiPollJob(jobId);
        if (job.status === "completed" && job.response) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setIsLoading(false);
          setChat((prev) => [
            ...prev,
            {
              role: "assistant",
              content: job.response!.message,
              recipes: job.response!.recipes,
            },
          ]);
          setApiMessages([
            ...sentMessages,
            { role: "assistant", content: job.response!.assistantMessage },
          ]);
        } else if (job.status === "failed") {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setIsLoading(false);
          setChat((prev) => [
            ...prev,
            { role: "assistant", content: job.error ?? "Something went wrong." },
          ]);
        }
      } catch {
        /* keep polling on network errors */
      }
    }, 5000);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");
    setIsLoading(true);
    setChat((prev) => [...prev, { role: "user", content: text }]);

    const newMessages: AiMessage[] = [
      ...apiMessages,
      { role: "user", content: text },
    ];

    try {
      const { jobId } = await aiStartJob(newMessages);
      startPolling(jobId, newMessages);
    } catch (err) {
      setIsLoading(false);
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: err instanceof Error ? err.message : "Error" },
      ]);
    }
  };

  const handlePickRecipe = (recipe: AiSuggestedRecipe) => {
    navigate("/recipes/new", { state: { aiRecipe: recipe } });
  };

  return (
    <div className="fp-main-narrow">
      <div className="fp-page-head" style={{ marginBottom: 14 }}>
        <div>
          <div className="fp-page-eyebrow">
            <Icon.Sparkles />
            {t("recipes.aiCreate")}
          </div>
          <h1>
            {t("recipes.aiCreate").split(" ")[0]}{" "}
            <em>{t("recipes.aiCreate").split(" ").slice(1).join(" ")}</em>
          </h1>
        </div>
        <button
          type="button"
          className="fp-btn fp-btn-ghost"
          onClick={() => navigate("/recipes")}
        >
          <Icon.ArrowLeft />
          {t("recipes.title")}
        </button>
      </div>

      <div className="fp-chat">
        <div className="fp-chat-stream">
          {chat.length === 0 && (
            <div className="fp-chat-empty">
              <Icon.Sparkles />
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  marginBottom: 6,
                }}
              >
                {t("recipes.aiCreate")}
              </div>
              <div>{t("recipes.aiHint")}</div>
            </div>
          )}

          {chat.map((entry, i) =>
            entry.role === "user" ? (
              <div key={i} className="fp-chat-bubble is-user">
                {entry.content}
              </div>
            ) : (
              <div key={i} style={{ display: "contents" }}>
                {entry.content && (
                  <div className="fp-chat-bubble is-assistant">{entry.content}</div>
                )}
                {entry.recipes?.map((recipe, ri) => (
                  <button
                    key={ri}
                    type="button"
                    className="fp-chat-recipe-card"
                    onClick={() => setPreviewRecipe(recipe)}
                  >
                    <div className="fp-chat-recipe-card-name">{recipe.name}</div>
                    {recipe.categories.length > 0 && (
                      <div className="fp-chat-recipe-card-meta">
                        {recipe.categories.map((c) => (
                          <span key={c} className="fp-recipe-meta-tag">
                            {t(`planner.${c}`)}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="fp-chat-recipe-card-ings">
                      {recipe.ingredients.map((i) => i.name).join(", ")}
                    </div>
                  </button>
                ))}
              </div>
            ),
          )}

          {isLoading && <Spinner />}
          <div ref={chatEndRef} />
        </div>

        <div className="fp-chat-composer">
          <input
            type="text"
            placeholder={t("recipes.aiPlaceholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading}
            autoFocus
          />
          <button
            type="button"
            className="fp-chat-send"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send"
          >
            <Icon.Send />
          </button>
        </div>
      </div>

      {previewRecipe && (
        <Modal
          open
          onClose={() => setPreviewRecipe(null)}
          title={previewRecipe.name}
          footer={
            <>
              <button
                type="button"
                className="fp-btn fp-btn-ghost"
                onClick={() => setPreviewRecipe(null)}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="fp-btn fp-btn-primary"
                onClick={() => {
                  const r = previewRecipe;
                  setPreviewRecipe(null);
                  handlePickRecipe(r);
                }}
              >
                <Icon.Check />
                {t("recipes.aiUseRecipe")}
              </button>
            </>
          }
        >
          {previewRecipe.categories.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              {previewRecipe.categories.map((c) => (
                <span key={c} className="fp-recipe-meta-tag">
                  {t(`planner.${c}`)}
                </span>
              ))}
            </div>
          )}
          <div className="fp-section-title">
            {t("recipes.ingredients")}{" "}
            <span className="count">{previewRecipe.ingredients.length}</span>
          </div>
          <div className="fp-ingredients" style={{ marginBottom: 16 }}>
            {previewRecipe.ingredients.map((ing, i) => (
              <div className="fp-ingredient" key={i}>
                <span className="fp-ingredient-name">{ing.name}</span>
                <span className="fp-ingredient-qty">{ing.quantity ?? "—"}</span>
                <span className="fp-ingredient-unit">{ing.unit ?? ""}</span>
              </div>
            ))}
          </div>
          {previewRecipe.instructions && (
            <>
              <div className="fp-section-title">{t("recipes.instructions")}</div>
              <div className="fp-instructions">{previewRecipe.instructions}</div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
