import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export function Modal({ open, onClose, title, children, footer, width = 460 }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 24, 18, 0.45)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          width: "100%",
          maxWidth: width,
          background: "var(--surface)",
          borderRadius: "var(--r-card)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--hairline)",
          maxHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {title && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 22px 14px",
              borderBottom: "1px solid var(--hairline)",
              fontFamily: "var(--font-display)",
              fontSize: 24,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}
          >
            <div style={{ flex: "1 1 auto", minWidth: 0 }}>{title}</div>
            <button
              type="button"
              className="fp-icon-btn"
              aria-label="Close"
              onClick={onClose}
              style={{ flex: "0 0 auto" }}
            >
              <Icon.X />
            </button>
          </div>
        )}
        <div style={{ padding: 22, overflowY: "auto", flex: "1 1 auto" }}>{children}</div>
        {footer && (
          <div
            style={{
              padding: "14px 22px 18px",
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              borderTop: "1px dashed var(--hairline)",
              background: "var(--cream)",
              flexWrap: "wrap",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
