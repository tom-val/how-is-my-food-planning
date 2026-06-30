import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getShoppingList,
  generateShoppingList,
  toggleItem,
  addCustomItem,
  type ShoppingListResponse,
} from "../../api/shoppingApi";
import { getPlan, getMonday } from "../../api/plannerApi";
import { Icon } from "../../components/sage/Icon";
import { Spinner } from "../../components/sage/Spinner";
import { Modal } from "../../components/sage/Modal";
import { BottomSheet } from "../../components/sage/BottomSheet";
import {
  isoWeek,
  parseLocalDate,
  weekOffsetLabel,
  weekRangeLabel,
} from "../../components/sage/dateUtils";

export default function WeeklyShoppingList() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(() => {
    try {
      const saved = localStorage.getItem("shopping.lastWeekStart");
      if (!saved) return 0;
      const savedDate = parseLocalDate(saved);
      const todayMonday = parseLocalDate(getMonday(new Date()));
      const diffMs = savedDate.getTime() - todayMonday.getTime();
      return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
    } catch {
      return 0;
    }
  });
  const [refreshOpen, setRefreshOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [itemUnit, setItemUnit] = useState("");

  const weekStart = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + weekOffset * 7);
    return getMonday(today);
  }, [weekOffset]);

  useEffect(() => {
    try {
      localStorage.setItem("shopping.lastWeekStart", weekStart);
    } catch {
      /* ignore */
    }
  }, [weekStart]);

  const monday = parseLocalDate(weekStart);
  const locale = i18n.language;
  const weekNo = isoWeek(monday);
  const lbl = weekOffsetLabel(weekOffset, (k, opts) => t(k, opts));
  const range = weekRangeLabel(monday, locale);

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

  const items = shoppingData?.items ?? [];
  const recipeMappings = shoppingData?.recipeMappings ?? [];

  const getRecipesFor = (name: string, unit: string | null): string[] =>
    recipeMappings
      .filter(
        (m) =>
          m.ingredientName.toLowerCase() === name.toLowerCase() &&
          (m.unit?.toLowerCase() ?? "") === (unit?.toLowerCase() ?? ""),
      )
      .map((m) => m.recipeName);

  const total = items.length;
  const done = items.filter((i) => i.isChecked).length;
  const pct = total === 0 ? 0 : done / total;
  const pctInt = Math.round(pct * 100);
  const C = 2 * Math.PI * 30;

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
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["shopping-list", planId] }),
  });

  const regenerateMutation = useMutation({
    mutationFn: () => generateShoppingList(planId!),
    onSuccess: (data) => {
      queryClient.setQueryData(["shopping-list", planId], data);
      setRefreshOpen(false);
    },
  });

  const addItemMutation = useMutation({
    mutationFn: () =>
      addCustomItem(
        planId!,
        itemName.trim(),
        itemQty ? Number(itemQty) : null,
        itemUnit.trim() || null,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-list", planId] });
      setItemName("");
      setItemQty("");
      setItemUnit("");
      setAddOpen(false);
    },
  });

  if (isPlanLoading || isItemsLoading) return <Spinner />;

  const summaryTitle =
    total === 0
      ? t("shopping.empty")
      : pctInt === 100
        ? t("shopping.summaryDone")
        : t("shopping.summaryTitle", { pct: pctInt });

  return (
    <>
      <div className="fp-page-head">
        <div>
          <div className="fp-page-eyebrow">{t("shopping.eyebrow")}</div>
          <h1>
            {t("shopping.title")} <em>{t("shopping.titleAccent")}</em>
          </h1>
          <div className="fp-page-sub">
            {t("shopping.subtitle", { range })} · Week {weekNo}
          </div>
        </div>
        <div className="fp-weeknav">
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o - 1)}
            aria-label="Previous week"
          >
            <Icon.Chevron dir="left" />
          </button>
          <span className="fp-weeknav-label">
            <span className="display">{lbl.head}</span>
            {lbl.tail}
          </span>
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o + 1)}
            aria-label="Next week"
          >
            <Icon.Chevron dir="right" />
          </button>
        </div>
      </div>

      {total > 0 && (
        <div className="fp-shop-summary">
          <div className="fp-progress-ring">
            <svg viewBox="0 0 76 76">
              <circle
                cx="38"
                cy="38"
                r="30"
                fill="none"
                stroke="oklch(0.94 0.025 145)"
                strokeWidth={6}
              />
              <circle
                cx="38"
                cy="38"
                r="30"
                fill="none"
                stroke="oklch(0.52 0.085 145)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={`${C * pct} ${C}`}
              />
            </svg>
            <div className="fp-progress-ring-label">
              <span className="n">
                {done}/{total}
              </span>
              <span className="l">{t("shopping.picked")}</span>
            </div>
          </div>
          <div className="fp-shop-summary-body">
            <div className="fp-shop-summary-title">
              {pctInt === 100 ? (
                <em>{summaryTitle}</em>
              ) : (
                <>
                  You're <em>{pctInt}%</em> there
                </>
              )}
            </div>
            <div className="fp-shop-summary-sub">
              {t("shopping.summarySub", { n: total - done })}
            </div>
          </div>
          <div className="fp-shop-summary-actions no-print">
            <button
              type="button"
              className="fp-btn fp-btn-ghost"
              onClick={() => setRefreshOpen(true)}
              disabled={!planId}
            >
              <Icon.Refresh />
              {t("shopping.refresh")}
            </button>
            <button
              type="button"
              className="fp-btn fp-btn-ghost"
              onClick={() => window.print()}
              disabled={!items.length}
            >
              <Icon.Printer />
              {t("common.print")}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="fp-additem no-print"
        onClick={() => setAddOpen(true)}
        disabled={!planId}
      >
        <Icon.Plus />
        {t("shopping.addItem")}
      </button>

      {items.length === 0 ? (
        <div className="fp-emptystate">
          <div className="fp-emptystate-mark">
            <Icon.Cart />
          </div>
          <div className="fp-emptystate-title">{t("shopping.empty")}</div>
        </div>
      ) : (
        <div className="fp-shop-list">
          {items.map((item) => {
            const sources = getRecipesFor(item.ingredientName, item.unit);
            return (
              <div
                key={item.id}
                className={`fp-shop-item ${item.isChecked ? "is-done" : ""}`}
                onClick={() =>
                  toggleMutation.mutate({
                    itemId: item.id,
                    isChecked: !item.isChecked,
                  })
                }
              >
                <span className={`fp-check ${item.isChecked ? "is-on" : ""}`}>
                  {item.isChecked && <Icon.Check />}
                </span>
                <span>
                  <span className="fp-shop-name">{item.ingredientName}</span>
                  {item.totalQuantity != null && (
                    <span className="fp-shop-qty">
                      {item.totalQuantity} {item.unit ?? ""}
                    </span>
                  )}
                </span>
                {sources.length > 0 && (
                  <span className="fp-shop-recipe" title={sources.join(", ")}>
                    {sources.length === 1 ? sources[0] : `${sources[0]} +${sources.length - 1}`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={refreshOpen}
        onClose={() => setRefreshOpen(false)}
        title={t("shopping.refreshConfirmTitle")}
        footer={
          <>
            <button
              type="button"
              className="fp-btn fp-btn-ghost"
              onClick={() => setRefreshOpen(false)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="fp-btn fp-btn-primary"
              disabled={regenerateMutation.isPending}
              onClick={() => regenerateMutation.mutate()}
            >
              <Icon.Refresh />
              {t("shopping.refresh")}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, color: "var(--muted)" }}>
          {t("shopping.refreshConfirmMessage")}
        </p>
      </Modal>

      <BottomSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t("shopping.addItem")}
        footer={
          <>
            <button
              type="button"
              className="fp-btn fp-btn-ghost"
              onClick={() => setAddOpen(false)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="fp-btn fp-btn-primary"
              disabled={!itemName.trim() || addItemMutation.isPending}
              onClick={() => addItemMutation.mutate()}
            >
              <Icon.Check />
              {t("common.save")}
            </button>
          </>
        }
      >
        <div className="fp-form">
          <div className="fp-field">
            <label className="fp-field-label" style={{ fontSize: 16 }}>
              {t("shopping.itemName")}
            </label>
            <input
              className="fp-input"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={t("shopping.addItemPlaceholder")}
              autoFocus
            />
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <div className="fp-field" style={{ flex: 1 }}>
              <label className="fp-field-label" style={{ fontSize: 16 }}>
                {t("recipes.quantity")}
              </label>
              <input
                className="fp-input"
                type="number"
                step="any"
                min={0}
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
              />
            </div>
            <div className="fp-field" style={{ flex: 1 }}>
              <label className="fp-field-label" style={{ fontSize: 16 }}>
                {t("recipes.unit")}
              </label>
              <input
                className="fp-input"
                value={itemUnit}
                onChange={(e) => setItemUnit(e.target.value)}
              />
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
