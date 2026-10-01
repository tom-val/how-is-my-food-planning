import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  shareRecipe,
  unshareRecipe,
  type RecipeWithIngredients,
} from "../../api/recipeApi";

/** Share / stop-sharing mutations for one recipe, keeping the recipe cache in sync. */
export function useRecipeSharing(recipeId: string) {
  const queryClient = useQueryClient();

  const applyShareToken = (shareToken: string | null) => {
    // Update the detail cache immediately so the UI reflects the new state...
    queryClient.setQueryData<RecipeWithIngredients>(["recipes", recipeId], (old) =>
      old ? { ...old, recipe: { ...old.recipe, shareToken } } : old,
    );
    // ...and mark every recipe query (list included) stale.
    void queryClient.invalidateQueries({ queryKey: ["recipes"] });
  };

  const share = useMutation({
    mutationFn: () => shareRecipe(recipeId),
    onSuccess: (data) => applyShareToken(data.shareToken),
  });

  const unshare = useMutation({
    mutationFn: () => unshareRecipe(recipeId),
    onSuccess: () => applyShareToken(null),
  });

  return { share, unshare };
}

export type RecipeSharing = ReturnType<typeof useRecipeSharing>;
