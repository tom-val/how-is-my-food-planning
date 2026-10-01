import { useTranslation } from "react-i18next";
import { Icon } from "../../components/sage/Icon";
import { EyeIcon, EyeOffIcon } from "./shoppingIcons";

interface HideTickedToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
}

/** Compact "Hide ticked" switch for the shopping summary card. */
export function HideTickedToggle({ checked, onChange }: HideTickedToggleProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`fp-shop-filter no-print ${checked ? "is-on" : ""}`}
      title={t("shopping.filter.hideTickedHint")}
      onClick={() => onChange(!checked)}
    >
      <EyeOffIcon />
      <span>{t("shopping.filter.hideTicked")}</span>
      <span className="fp-shop-filter-switch" aria-hidden="true" />
    </button>
  );
}

interface ShowTickedProps {
  /** Number of ticked items currently hidden. */
  count: number;
  onShow: () => void;
}

/** "5 ticked items hidden · Show" line under a filtered list. */
export function HiddenTickedNote({ count, onShow }: ShowTickedProps) {
  const { t } = useTranslation();
  return (
    <button type="button" className="fp-shop-hidden-note no-print" onClick={onShow}>
      <EyeOffIcon />
      <span>{t("shopping.filter.hiddenCount", { count })}</span>
      <span aria-hidden="true">·</span>
      <span className="fp-shop-hidden-note-action">{t("shopping.filter.show")}</span>
    </button>
  );
}

/** Shown instead of a blank list when every item is ticked and hidden. */
export function AllTickedState({ onShow }: Pick<ShowTickedProps, "onShow">) {
  const { t } = useTranslation();
  return (
    <div className="fp-emptystate fp-shop-alldone">
      <div className="fp-emptystate-mark">
        <Icon.Check />
      </div>
      <div className="fp-emptystate-title">{t("shopping.filter.allDoneTitle")}</div>
      <div className="fp-shop-alldone-sub">{t("shopping.filter.allDoneSub")}</div>
      <button
        type="button"
        className="fp-btn fp-btn-ghost no-print"
        onClick={onShow}
      >
        <EyeIcon />
        {t("shopping.filter.showTicked")}
      </button>
    </div>
  );
}
