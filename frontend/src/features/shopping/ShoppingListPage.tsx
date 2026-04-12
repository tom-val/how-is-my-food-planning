import { useMemo, useState } from "react";
import {
  Typography,
  Box,
  Card,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Divider,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  IconButton,
  TextField,
} from "@mui/material";
import { Refresh, ChevronLeft, ChevronRight, Print, Add } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getShoppingList,
  generateShoppingList,
  toggleItem,
  addCustomItem,
} from "../../api/shoppingApi";
import type { ShoppingListResponse } from "../../api/shoppingApi";
import { getPlan, getMonday } from "../../api/plannerApi";

export default function ShoppingListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [customItemName, setCustomItemName] = useState("");
  const [customItemQuantity, setCustomItemQuantity] = useState("");
  const [customItemUnit, setCustomItemUnit] = useState("");
  const [isRefreshDialogOpen, setIsRefreshDialogOpen] = useState(false);

  const weekStart = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);
    return getMonday(today);
  }, [weekOffset]);

  const weekLabel = useMemo(() => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `${fmt(start)} – ${fmt(end)}`;
  }, [weekStart]);

  const { data: planData, isLoading: isPlanLoading } = useQuery({
    queryKey: ["plan", weekStart],
    queryFn: () => getPlan(weekStart),
  });

  const planId = planData?.plan.id;

  const { data: shoppingData, isLoading: isItemsLoading } = useQuery({
    queryKey: ["shopping-list", planId],
    queryFn: () => getShoppingList(planId!),
    enabled: !!planId,
  });

  const items = shoppingData?.items;
  const recipeMappings = shoppingData?.recipeMappings ?? [];

  const getRecipesForIngredient = (ingredientName: string, unit: string | null): string[] => {
    return recipeMappings
      .filter(
        (m) =>
          m.ingredientName.toLowerCase() === ingredientName.toLowerCase() &&
          (m.unit?.toLowerCase() ?? "") === (unit?.toLowerCase() ?? ""),
      )
      .map((m) => m.recipeName);
  };

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) =>
      toggleItem(itemId, isChecked),
    onMutate: async ({ itemId, isChecked }) => {
      await queryClient.cancelQueries({ queryKey: ["shopping-list", planId] });
      queryClient.setQueryData(
        ["shopping-list", planId],
        (old: ShoppingListResponse | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items
              .map((i) => (i.id === itemId ? { ...i, isChecked } : i))
              .sort(
                (a, b) =>
                  Number(a.isChecked) - Number(b.isChecked) ||
                  a.ingredientName.localeCompare(b.ingredientName),
              ),
          };
        },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list", planId] });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => generateShoppingList(planId!),
    onSuccess: (data) => {
      queryClient.setQueryData(["shopping-list", planId], data);
      setIsRefreshDialogOpen(false);
    },
  });

  const addItemMutation = useMutation({
    mutationFn: () =>
      addCustomItem(
        planId!,
        customItemName.trim(),
        customItemQuantity ? Number(customItemQuantity) : null,
        customItemUnit.trim() || null,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list", planId] });
      setCustomItemName("");
      setCustomItemQuantity("");
      setCustomItemUnit("");
      setIsAddDialogOpen(false);
    },
  });


  const isLoading = isPlanLoading || isItemsLoading;
  const checkedCount = items?.filter((i) => i.isChecked).length ?? 0;
  const totalCount = items?.length ?? 0;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Week navigation */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <IconButton onClick={() => setWeekOffset((o) => o - 1)} className="no-print">
          <ChevronLeft />
        </IconButton>
        <Box textAlign="center">
          <Typography variant="h4">{t("shopping.title")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {weekLabel}
          </Typography>
        </Box>
        <IconButton onClick={() => setWeekOffset((o) => o + 1)} className="no-print">
          <ChevronRight />
        </IconButton>
      </Box>

      {weekOffset !== 0 && (
        <Box display="flex" justifyContent="center" mb={2} className="no-print">
          <Button size="small" onClick={() => setWeekOffset(0)}>
            {t("planner.today")}
          </Button>
        </Box>
      )}

      {/* Summary + actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        {totalCount > 0 ? (
          <Chip
            label={`${checkedCount} / ${totalCount}`}
            color={checkedCount === totalCount ? "success" : "default"}
            variant="outlined"
          />
        ) : (
          <Box />
        )}
        <Box display="flex" gap={1} className="no-print">
          <Button
            size="small"
            startIcon={<Print />}
            onClick={() => window.print()}
            disabled={!items?.length}
          >
            {t("common.print")}
          </Button>
          <Button
            size="small"
            startIcon={<Refresh />}
            onClick={() => setIsRefreshDialogOpen(true)}
            disabled={!planId}
          >
            {t("shopping.refresh")}
          </Button>
        </Box>
      </Box>

      {/* Add custom item button */}
      <Box mb={2} className="no-print">
        <Button
          size="small"
          startIcon={<Add />}
          onClick={() => setIsAddDialogOpen(true)}
          disabled={!planId}
        >
          {t("shopping.addItem")}
        </Button>
      </Box>

      {/* List */}
      {!items?.length ? (
        <Box textAlign="center" py={6}>
          <Typography color="text.secondary">{t("shopping.empty")}</Typography>
        </Box>
      ) : (
        <Card>
          <List disablePadding>
            {items.map((item, index) => {
              const recipes = getRecipesForIngredient(item.ingredientName, item.unit);
              return (
                <Box key={item.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      opacity: item.isChecked ? 0.5 : 1,
                      alignItems: "flex-start",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                      <Checkbox
                        edge="start"
                        checked={item.isChecked}
                        onChange={() =>
                          toggleMutation.mutate({
                            itemId: item.id,
                            isChecked: !item.isChecked,
                          })
                        }
                        color="primary"
                        className="no-print"
                      />
                      {/* Print-only empty checkbox */}
                      <Box
                        className="print-only"
                        sx={{
                          width: 14,
                          height: 14,
                          border: "1.5px solid #333",
                          borderRadius: 0.5,
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            textDecoration: item.isChecked ? "line-through" : "none",
                            fontWeight: 500,
                          }}
                        >
                          {item.ingredientName}
                          {item.totalQuantity != null && (
                            <Typography
                              component="span"
                              color="text.secondary"
                              sx={{ ml: 1 }}
                            >
                              {item.totalQuantity} {item.unit ?? ""}
                            </Typography>
                          )}
                        </Typography>
                      }
                      secondary={
                        recipes.length > 0 && (
                          <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5} className="no-print">
                            {recipes.map((name) => (
                              <Chip
                                key={name}
                                label={name}
                                size="small"
                                variant="outlined"
                                sx={{ height: 22, fontSize: "0.7rem" }}
                              />
                            ))}
                          </Box>
                        )
                      }
                    />
                  </ListItem>
                </Box>
              );
            })}
          </List>
        </Card>
      )}

      {/* Refresh confirmation dialog */}
      <Dialog
        open={isRefreshDialogOpen}
        onClose={() => setIsRefreshDialogOpen(false)}
      >
        <DialogTitle>{t("shopping.refreshConfirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("shopping.refreshConfirmMessage")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsRefreshDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
          >
            {t("shopping.refresh")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add custom item dialog */}
      <Dialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("shopping.addItem")}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t("shopping.itemName")}
            value={customItemName}
            onChange={(e) => setCustomItemName(e.target.value)}
            margin="normal"
            required
            autoFocus
          />
          <Box display="flex" gap={1.5}>
            <TextField
              label={t("recipes.quantity")}
              value={customItemQuantity}
              onChange={(e) => setCustomItemQuantity(e.target.value)}
              type="number"
              inputProps={{ step: "any", min: 0 }}
              sx={{ flex: 1 }}
              margin="normal"
            />
            <TextField
              label={t("recipes.unit")}
              value={customItemUnit}
              onChange={(e) => setCustomItemUnit(e.target.value)}
              sx={{ flex: 1 }}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={() => addItemMutation.mutate()}
            disabled={!customItemName.trim() || addItemMutation.isPending}
          >
            {t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
