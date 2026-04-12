import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Button,
  CircularProgress,
  Chip,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { ArrowBack, Send, AutoAwesome, Close } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { aiStartJob, aiPollJob } from "../../api/recipeApi";
import type { AiMessage, AiSuggestedRecipe } from "../../api/recipeApi";

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
        // Keep polling on network errors.
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
    navigate("/recipes/new", {
      state: { aiRecipe: recipe },
    });
  };

  return (
    <Box
      maxWidth={600}
      mx="auto"
      display="flex"
      flexDirection="column"
      sx={{ height: "calc(100vh - 130px)" }}
    >
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/recipes")}
          size="small"
        >
          {t("recipes.title")}
        </Button>
        <Box flexGrow={1} />
        <AutoAwesome color="primary" />
        <Typography variant="h6" fontWeight={600}>
          {t("recipes.aiCreate")}
        </Typography>
      </Box>

      {/* Chat area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          mb: 2,
        }}
      >
        {chat.length === 0 && (
          <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
            <AutoAwesome sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
            <Typography>{t("recipes.aiHint")}</Typography>
          </Box>
        )}

        {chat.map((entry, i) => (
          <Box key={i}>
            {entry.role === "user" ? (
              <Box
                sx={{
                  alignSelf: "flex-end",
                  bgcolor: "primary.main",
                  color: "white",
                  px: 2,
                  py: 1,
                  borderRadius: 3,
                  borderBottomRightRadius: 0.5,
                  maxWidth: "85%",
                  ml: "auto",
                }}
              >
                <Typography variant="body2">{entry.content}</Typography>
              </Box>
            ) : (
              <Box>
                {entry.content && (
                  <Box
                    sx={{
                      bgcolor: (t) => alpha(t.palette.grey[500], 0.1),
                      px: 2,
                      py: 1,
                      borderRadius: 3,
                      borderBottomLeftRadius: 0.5,
                      maxWidth: "85%",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">{entry.content}</Typography>
                  </Box>
                )}
                {entry.recipes?.map((recipe, ri) => (
                  <Card key={ri} sx={{ mb: 1 }}>
                    <CardActionArea onClick={() => setPreviewRecipe(recipe)}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="h6" fontSize="1rem">
                          {recipe.name}
                        </Typography>
                        {recipe.categories.length > 0 && (
                          <Box display="flex" gap={0.5} mt={0.5}>
                            {recipe.categories.map((cat) => (
                              <Chip
                                key={cat}
                                label={t(`planner.${cat}`)}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.7rem" }}
                              />
                            ))}
                          </Box>
                        )}
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mt={0.5}
                          noWrap
                        >
                          {recipe.ingredients.map((i) => i.name).join(", ")}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        ))}

        {isLoading && (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        )}
        <div ref={chatEndRef} />
      </Box>

      {/* Input bar — fixed at bottom */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          py: 1.5,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.default",
        }}
      >
        <TextField
          fullWidth
          size="small"
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
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
        >
          <Send />
        </IconButton>
      </Box>

      {/* Recipe preview dialog */}
      <Dialog
        open={!!previewRecipe}
        onClose={() => setPreviewRecipe(null)}
        fullWidth
        maxWidth="sm"
      >
        {previewRecipe && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {previewRecipe.name}
              <IconButton size="small" onClick={() => setPreviewRecipe(null)}>
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              {previewRecipe.categories.length > 0 && (
                <Box display="flex" gap={0.5} mb={2}>
                  {previewRecipe.categories.map((cat) => (
                    <Chip
                      key={cat}
                      label={t(`planner.${cat}`)}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {t("recipes.ingredients")} ({previewRecipe.ingredients.length})
              </Typography>
              <List dense disablePadding>
                {previewRecipe.ingredients.map((ing, i) => (
                  <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={ing.name}
                      secondary={[ing.quantity, ing.unit].filter(Boolean).join(" ") || undefined}
                    />
                  </ListItem>
                ))}
              </List>

              {previewRecipe.instructions && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t("recipes.instructions")}
                  </Typography>
                  <Typography variant="body2" whiteSpace="pre-wrap">
                    {previewRecipe.instructions}
                  </Typography>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewRecipe(null)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  handlePickRecipe(previewRecipe);
                  setPreviewRecipe(null);
                }}
              >
                {t("recipes.aiUseRecipe")}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
