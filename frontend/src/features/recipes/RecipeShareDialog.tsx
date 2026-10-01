import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useSnackbar } from "notistack";
import { buildShareUrl } from "../../api/recipeApi";
import { BottomSheet } from "../../components/sage/BottomSheet";
import { Icon } from "../../components/sage/Icon";
import { Modal } from "../../components/sage/Modal";
import { Spinner } from "../../components/sage/Spinner";
import { useMobile } from "../../components/sage/useMobile";
import { ShareIcon } from "./shareIcons";
import type { RecipeSharing } from "./useRecipeSharing";

interface RecipeShareDialogProps {
  open: boolean;
  onClose: () => void;
  recipeName: string;
  shareToken: string | null;
  sharing: RecipeSharing;
}

const canNativeShare =
  typeof navigator !== "undefined" && typeof navigator.share === "function";

/**
 * Shows the public link for a recipe (created by the caller before opening),
 * with copy / native share, and lets the owner stop sharing after confirming.
 * Modal on desktop, bottom sheet on mobile.
 */
export function RecipeShareDialog({
  open,
  onClose,
  recipeName,
  shareToken,
  sharing,
}: RecipeShareDialogProps) {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();
  const isMobile = useMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [confirmingStop, setConfirmingStop] = useState(false);
  const { share, unshare } = sharing;

  const url = shareToken ? buildShareUrl(shareToken) : null;

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleClose = () => {
    setConfirmingStop(false);
    setCopied(false);
    onClose();
  };

  const selectLink = () => {
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  const handleCopy = async () => {
    if (!url) return;
    try {
      // The Clipboard API is missing on insecure origins and some webviews.
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      selectLink();
      enqueueSnackbar(t("share.copyFailed"), { variant: "warning" });
    }
  };

  const handleNativeShare = async () => {
    if (!url) return;
    try {
      await navigator.share({
        title: recipeName,
        text: t("share.nativeShareText", { name: recipeName }),
        url,
      });
    } catch (err) {
      // The user closing the share sheet is not an error.
      if (err instanceof DOMException && err.name === "AbortError") return;
      enqueueSnackbar(t("share.shareFailed"), { variant: "error" });
    }
  };

  const handleStopSharing = () => {
    unshare.mutate(undefined, {
      onSuccess: () => {
        enqueueSnackbar(t("share.stopped"), { variant: "success" });
        handleClose();
      },
      onError: () => enqueueSnackbar(t("share.stopError"), { variant: "error" }),
    });
  };

  let body: ReactNode;
  let footer: ReactNode;

  if (!url) {
    // The link is being created (or creation failed).
    body = share.isError ? (
      <div className="fp-alert fp-alert-error" style={{ margin: 0 }}>
        {t("share.createError")}
      </div>
    ) : (
      <div className="fp-share-pending">
        <Spinner inline />
        <span>{t("share.creating")}</span>
      </div>
    );
    // Keyed per view so buttons remount rather than morphing between styles.
    footer = (
      <Fragment key="pending">
        <button type="button" className="fp-btn fp-btn-ghost" onClick={handleClose}>
          {t("common.cancel")}
        </button>
        {share.isError && (
          <button
            type="button"
            className="fp-btn fp-btn-primary"
            onClick={() => share.mutate()}
          >
            <Icon.Refresh />
            {t("share.retry")}
          </button>
        )}
      </Fragment>
    );
  } else if (confirmingStop) {
    body = (
      <p style={{ margin: 0, color: "var(--muted)" }}>{t("share.stopConfirmMessage")}</p>
    );
    footer = (
      <Fragment key="confirm">
        <button
          type="button"
          className="fp-btn fp-btn-ghost"
          onClick={() => setConfirmingStop(false)}
        >
          {t("common.cancel")}
        </button>
        <button
          type="button"
          className="fp-btn fp-btn-danger"
          disabled={unshare.isPending}
          onClick={handleStopSharing}
        >
          {unshare.isPending ? <Spinner inline /> : <Icon.X />}
          {t("share.stop")}
        </button>
      </Fragment>
    );
  } else {
    body = (
      <div className="fp-share">
        <div className="fp-share-note">
          <Icon.Globe />
          <span>{t("share.publicNote")}</span>
        </div>

        <label className="fp-share-label" htmlFor="fp-share-url">
          {t("share.linkLabel")}
        </label>
        <div className="fp-share-row">
          <input
            id="fp-share-url"
            ref={inputRef}
            className="fp-input fp-share-url"
            type="text"
            value={url}
            readOnly
            onFocus={(e) => e.currentTarget.select()}
          />
          <button
            type="button"
            className={`fp-btn ${copied ? "fp-btn-ghost" : "fp-btn-primary"}`}
            onClick={handleCopy}
            aria-live="polite"
          >
            {copied ? <Icon.Check /> : <Icon.Copy />}
            {copied ? t("share.copied") : t("share.copy")}
          </button>
        </div>

        <div className="fp-share-actions">
          {canNativeShare && (
            <button type="button" className="fp-btn fp-btn-ghost" onClick={handleNativeShare}>
              <ShareIcon />
              {t("share.nativeShare")}
            </button>
          )}
          <a className="fp-textbtn" href={url} target="_blank" rel="noopener noreferrer">
            <Icon.External />
            {t("share.preview")}
          </a>
        </div>
      </div>
    );
    footer = (
      <Fragment key="link">
        <button
          type="button"
          className="fp-btn fp-btn-danger"
          style={{ marginRight: "auto" }}
          onClick={() => setConfirmingStop(true)}
        >
          {t("share.stop")}
        </button>
        <button type="button" className="fp-btn fp-btn-primary" onClick={handleClose}>
          {t("share.done")}
        </button>
      </Fragment>
    );
  }

  const title = confirmingStop ? t("share.stopConfirmTitle") : t("share.dialogTitle");

  return isMobile ? (
    <BottomSheet open={open} onClose={handleClose} title={title} footer={footer}>
      {body}
    </BottomSheet>
  ) : (
    <Modal open={open} onClose={handleClose} title={title} footer={footer} width={520}>
      {body}
    </Modal>
  );
}
