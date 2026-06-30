import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

const DISMISS_THRESHOLD = 110;

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  footer,
}: BottomSheetProps) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);

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

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    const dy = e.clientY - startY.current;
    setDragY(dy > 0 ? dy : 0);
  };
  const onPointerUp = () => {
    if (startY.current === null) return;
    if (dragY > DISMISS_THRESHOLD) {
      onClose();
    }
    // Always reset so the next open starts from rest.
    setDragY(0);
    startY.current = null;
    setDragging(false);
  };

  return createPortal(
    <div
      className="fp-sheet-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="fp-sheet"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragging ? "none" : undefined,
        }}
      >
        <div
          className="fp-sheet-grab"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span className="fp-sheet-handle" />
          {title && (
            <div className="fp-sheet-head">
              <div className="fp-sheet-title">{title}</div>
              <button
                type="button"
                className="fp-icon-btn"
                aria-label="Close"
                onClick={onClose}
              >
                <Icon.X />
              </button>
            </div>
          )}
        </div>
        <div className="fp-sheet-body">{children}</div>
        {footer && <div className="fp-sheet-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
