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
} from "@mui/material";
import { Refresh, ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getShoppingList,
  generateShoppingList,
  toggleItem,
} from "../../api/shoppingApi";
import { getPlan, getMonday } from "../../api/plannerApi";

export default function ShoppingListPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
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

  const {
    data: items,
    isLoading: isItemsLoading,
  } = useQuery({
    queryKey: ["shopping-list", planId],
    queryFn: () => getShoppingList(planId!),
    enabled: !!planId,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) =>
      toggleItem(itemId, isChecked),
    onMutate: async ({ itemId, isChecked }) => {
      // Optimistic update.
      await queryClient.cancelQueries({ queryKey: ["shopping-list", planId] });
      queryClient.setQueryData(
        ["shopping-list", planId],
        (old: typeof items) =>
          old
            ?.map((i) => (i.id === itemId ? { ...i, isChecked } : i))
            .sort((a, b) => Number(a.isChecked) - Number(b.isChecked) || a.ingredientName.localeCompare(b.ingredientName)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list", planId] });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => generateShoppingList(planId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list", planId] });
      setIsRefreshDialogOpen(false);
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
        <IconButton onClick={() => setWeekOffset((o) => o - 1)}>
          <ChevronLeft />
        </IconButton>
        <Box textAlign="center">
          <Typography variant="h4">{t("shopping.title")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {weekLabel}
          </Typography>
        </Box>
        <IconButton onClick={() => setWeekOffset((o) => o + 1)}>
          <ChevronRight />
        </IconButton>
      </Box>

      {weekOffset !== 0 && (
        <Box display="flex" justifyContent="center" mb={2}>
          <Button size="small" onClick={() => setWeekOffset(0)}>
            {t("planner.today")}
          </Button>
        </Box>
      )}

      {/* Summary + refresh */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        {totalCount > 0 && (
          <Chip
            label={`${checkedCount} / ${totalCount}`}
            color={checkedCount === totalCount ? "success" : "default"}
            variant="outlined"
          />
        )}
        <Button
          size="small"
          startIcon={<Refresh />}
          onClick={() => setIsRefreshDialogOpen(true)}
          disabled={!planId}
        >
          {t("shopping.refresh")}
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
            {items.map((item, index) => (
              <Box key={item.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    opacity: item.isChecked ? 0.5 : 1,
                    textDecoration: item.isChecked ? "line-through" : "none",
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
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
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.ingredientName}
                    secondary={
                      [item.totalQuantity, item.unit]
                        .filter(Boolean)
                        .join(" ") || undefined
                    }
                  />
                </ListItem>
              </Box>
            ))}
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
    </Box>
  );
}
