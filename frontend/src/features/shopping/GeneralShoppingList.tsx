import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGeneralShoppingList,
  addGeneralItem,
  toggleGeneralItem,
  deleteGeneralItem,
  type GeneralShoppingItem,
} from "../../api/generalShoppingApi";
import { Icon } from "../../components/sage/Icon";
import { Spinner } from "../../components/sage/Spinner";
import { Modal } from "../../components/sage/Modal";
import { BottomSheet } from "../../components/sage/BottomSheet";

const KEY = ["general-shopping"];

export default function GeneralShoppingList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [pendingDelete, setPendingDelete] = useState<GeneralShoppingItem | null>(
    null,
  );

  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: getGeneralShoppingList,
  });

  const items = data ?? [];
  const total = items.length;
  const done = items.filter((i) => i.isChecked).length;
  const pct = total === 0 ? 0 : done / total;
  const pctInt = Math.round(pct * 100);
  const C = 2 * Math.PI * 30;

  const toggleMutation = useMutation({
    mutationFn: ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) =>
      toggleGeneralItem(itemId, isChecked),
    onMutate: async ({ itemId, isChecked }) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      queryClient.setQueryData(
        KEY,
        (old: GeneralShoppingItem[] | undefined) => {
          if (!old) return old;
          return old
            .map((i) => (i.id === itemId ? { ...i, isChecked } : i))
            .sort(
              (a, b) =>
                Number(a.isChecked) - Number(b.isChecked) ||
                a.itemName.localeCompare(b.itemName),
            );
        },
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });

  const addItemMutation = useMutation({
    mutationFn: () =>
      addGeneralItem(itemName.trim(), itemQty ? Number(itemQty) : null, null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      setItemName("");
      setItemQty("");
      setAddOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => deleteGeneralItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      setPendingDelete(null);
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <>
      <div className="fp-page-head">
        <div>
          <div className="fp-page-eyebrow">{t("generalShopping.eyebrow")}</div>
          <h1>
            {t("shopping.title")} <em>{t("shopping.titleAccent")}</em>
          </h1>
          <div className="fp-page-sub">{t("generalShopping.subtitle")}</div>
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
                <em>{t("generalShopping.summaryDone")}</em>
              ) : (
                <>
                  You're <em>{pctInt}%</em> there
                </>
              )}
            </div>
            <div className="fp-shop-summary-sub">
              {t("generalShopping.summarySub", { n: total - done })}
            </div>
          </div>
          <div className="fp-shop-summary-actions no-print">
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
      >
        <Icon.Plus />
        {t("generalShopping.addItem")}
      </button>

      {items.length === 0 ? (
        <div className="fp-emptystate">
          <div className="fp-emptystate-mark">
            <Icon.Cart />
          </div>
          <div className="fp-emptystate-title">{t("generalShopping.empty")}</div>
        </div>
      ) : (
        <div className="fp-shop-list">
          {items.map((item) => (
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
                <span className="fp-shop-name">{item.itemName}</span>
                {item.quantity != null && (
                  <span className="fp-shop-qty">
                    {item.quantity} {item.unit ?? ""}
                  </span>
                )}
              </span>
              <button
                type="button"
                className="fp-icon-btn no-print"
                aria-label={t("common.delete")}
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDelete(item);
                }}
              >
                <Icon.Trash />
              </button>
            </div>
          ))}
        </div>
      )}

      <BottomSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={t("generalShopping.addItem")}
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
              {t("generalShopping.itemName")}
            </label>
            <input
              className="fp-input"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder={t("generalShopping.addItemPlaceholder")}
              autoFocus
            />
          </div>
          <div className="fp-field">
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
        </div>
      </BottomSheet>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title={t("generalShopping.deleteConfirmTitle")}
        footer={
          <>
            <button
              type="button"
              className="fp-btn fp-btn-ghost"
              onClick={() => setPendingDelete(null)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className="fp-btn fp-btn-primary"
              disabled={deleteMutation.isPending}
              onClick={() =>
                pendingDelete && deleteMutation.mutate(pendingDelete.id)
              }
            >
              <Icon.Trash />
              {t("common.delete")}
            </button>
          </>
        }
      >
        <p style={{ margin: 0, color: "var(--muted)" }}>
          {t("generalShopping.deleteConfirmMessage", {
            name: pendingDelete?.itemName ?? "",
          })}
        </p>
      </Modal>
    </>
  );
}
