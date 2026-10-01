import { useIsMutating, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import {
  getAiSortJob,
  MIN_CATEGORIES_FOR_AI_SORT,
  readApiError,
  startAiSort,
  type AiSortJob,
  type AiSortList,
} from "../../api/shoppingCategoriesApi";
import {
  GENERAL_SHOPPING_KEY,
  SHOPPING_CATEGORIES_KEY,
  WEEKLY_SHOPPING_KEY_ROOT,
} from "./useShoppingCategories";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 2 * 60 * 1000;

type AiSortFailure = "notEnoughCategories" | "failed" | "timeout";

class AiSortError extends Error {
  readonly reason: AiSortFailure;
  constructor(reason: AiSortFailure, message?: string) {
    super(message ?? reason);
    this.reason = reason;
  }
}

type AiSortResult = "sorted" | "nothingToSort";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Starts an AI sort job and polls it until it completes, fails or times out.
 * Runs inside a mutation so it keeps going (and refreshes the list) even if
 * the user switches tab or week while it is in progress.
 */
async function runAiSort(
  list: AiSortList,
  planId: string | undefined,
): Promise<AiSortResult> {
  let jobId: string | null;
  try {
    ({ jobId } = await startAiSort(list, planId));
  } catch (err) {
    if (readApiError(err).code === "notEnoughCategories") {
      throw new AiSortError("notEnoughCategories");
    }
    throw err;
  }
  if (!jobId) return "nothingToSort";

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await delay(POLL_INTERVAL_MS);
    let job: AiSortJob;
    try {
      job = await getAiSortJob(jobId);
    } catch (err) {
      // Keep polling through network blips and server errors (as the AI
      // recipe chat does), but stop on client errors such as an unknown job.
      const { status } = readApiError(err);
      if (status !== null && status >= 400 && status < 500 && status !== 408 && status !== 429) {
        throw new AiSortError("failed");
      }
      continue;
    }
    if (job.status === "completed") return "sorted";
    if (job.status === "failed") {
      throw new AiSortError("failed", job.error ?? undefined);
    }
  }
  throw new AiSortError("timeout");
}

/** AI-sorts one shopping list's items into the family's categories. */
export function useAiSort(list: AiSortList, planId: string | undefined) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const mutationKey = ["shopping-ai-sort", list, planId ?? null];

  // Shared across mounts so the busy state survives tab/week switches.
  const runningCount = useIsMutating({ mutationKey, exact: true });

  const mutation = useMutation({
    mutationKey,
    mutationFn: () => runAiSort(list, planId),
    onSuccess: (result) => {
      // Assignments are family-wide by product name, so both lists may change.
      queryClient.invalidateQueries({ queryKey: WEEKLY_SHOPPING_KEY_ROOT });
      queryClient.invalidateQueries({ queryKey: GENERAL_SHOPPING_KEY });
      enqueueSnackbar(
        result === "sorted"
          ? t("shopping.categories.aiSortDone")
          : t("shopping.categories.aiSortNothing"),
        { variant: result === "sorted" ? "success" : "info" },
      );
    },
    onError: (err) => {
      const reason = err instanceof AiSortError ? err.reason : null;
      if (reason === "notEnoughCategories") {
        // Our cached categories are out of date; refresh them.
        queryClient.invalidateQueries({ queryKey: SHOPPING_CATEGORIES_KEY });
        enqueueSnackbar(
          t("shopping.categories.aiSortNeedCategories", {
            min: MIN_CATEGORIES_FOR_AI_SORT,
          }),
          { variant: "warning" },
        );
        return;
      }
      if (reason === "failed" && err.message && err.message !== "failed") {
        console.warn("AI sort failed:", err.message);
      }
      enqueueSnackbar(
        reason === "timeout"
          ? t("shopping.categories.aiSortTimeout")
          : t("shopping.categories.aiSortError"),
        { variant: "error" },
      );
    },
  });

  const isRunning = runningCount > 0 || mutation.isPending;

  const start = () => {
    // Read the mutation cache directly so a fast double-click (before the
    // next render) still can't start a second job.
    if (queryClient.isMutating({ mutationKey, exact: true }) > 0) return;
    mutation.mutate();
  };

  return { start, isRunning };
}
