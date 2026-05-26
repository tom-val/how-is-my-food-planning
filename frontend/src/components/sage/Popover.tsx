import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type PopoverAlign = "left" | "right" | "center";

interface PopoverProps {
  anchor: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  align?: PopoverAlign;
  offset?: number;
}

export function Popover({
  anchor,
  onClose,
  children,
  className = "",
  align = "right",
  offset = 8,
}: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({
    position: "fixed",
    visibility: "hidden",
    top: 0,
    left: 0,
  });

  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const a = anchor.getBoundingClientRect();
    const p = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 8;

    let left: number;
    if (align === "right") {
      left = a.right - p.width;
    } else if (align === "center") {
      left = a.left + a.width / 2 - p.width / 2;
    } else {
      left = a.left;
    }
    // Clamp to viewport on both sides regardless of alignment.
    left = Math.max(pad, Math.min(left, vw - p.width - pad));

    let top = a.bottom + offset;
    if (top + p.height > vh - pad) {
      // Flip above the anchor if it would overflow.
      const flipped = a.top - p.height - offset;
      if (flipped > pad) top = flipped;
      else top = Math.max(pad, vh - p.height - pad);
    }

    setStyle({ position: "fixed", top, left, visibility: "visible" });
  }, [anchor, align, offset, children]);

  useEffect(() => {
    if (!anchor) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (anchor.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [anchor, onClose]);

  if (!anchor) return null;

  return createPortal(
    <div ref={ref} className={`fp-popover ${className}`} style={style}>
      {children}
    </div>,
    document.body,
  );
}
