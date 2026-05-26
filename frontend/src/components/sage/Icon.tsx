/* eslint-disable react-refresh/only-export-components */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const Icon = {
  Leaf: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96a1 1 0 0 1 1.6.66c1.6 16.27-11 17.66-11 17.66z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  ),
  Calendar: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Book: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
      <path d="M4 19.5V22h16" />
    </svg>
  ),
  Cart: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 3h2l2.5 12.5a2 2 0 0 0 2 1.5h8.5a2 2 0 0 0 2-1.5L21.5 7H6" />
    </svg>
  ),
  Users: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Globe: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
  Logout: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  ),
  Chevron: ({ dir = "right", ...p }: IconProps & { dir?: "right" | "left" | "up" | "down" }) => {
    const m = {
      right: "M9 6l6 6-6 6",
      left: "M15 6l-6 6 6 6",
      up: "M6 15l6-6 6 6",
      down: "M6 9l6 6 6-6",
    };
    return (
      <svg {...base} strokeWidth={2} {...p}>
        <path d={m[dir]} />
      </svg>
    );
  },
  Plus: (p: IconProps = {}) => (
    <svg {...base} strokeWidth={2} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  X: (p: IconProps = {}) => (
    <svg {...base} strokeWidth={2.2} {...p}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  Dice: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
      <circle cx="16" cy="8" r="1" fill="currentColor" />
      <circle cx="8" cy="16" r="1" fill="currentColor" />
      <circle cx="16" cy="16" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  Search: (p: IconProps = {}) => (
    <svg {...base} strokeWidth={1.8} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Printer: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  Refresh: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  ),
  Edit: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <path d="M17 3a2.85 2.85 0 1 1 4 4L7 21H3v-4z" />
    </svg>
  ),
  Trash: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Check: (p: IconProps = {}) => (
    <svg {...base} strokeWidth={3} {...p}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowLeft: (p: IconProps = {}) => (
    <svg {...base} strokeWidth={1.8} {...p}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  External: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  ),
  Sparkles: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
      <path d="M19 14l.9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z" />
      <path d="M5 16l.6 1.4L7 18l-1.4.6L5 20l-.6-1.4L3 18l1.4-.6z" />
    </svg>
  ),
  Camera: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  Forward: (p: IconProps = {}) => (
    <svg {...base} strokeWidth={1.8} {...p}>
      <polyline points="15 17 20 12 15 7" />
      <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </svg>
  ),
  Coffee: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  ),
  Bowl: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <path d="M3 11a9 9 0 0 0 18 0z" />
      <path d="M2 11h20" />
      <path d="M9 7c0-1 .5-2 1.5-2.5" />
      <path d="M14 6c.5-1 1.5-1.5 2.5-1" />
    </svg>
  ),
  Plate: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
    </svg>
  ),
  Apple: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <path d="M12 7c-2-3-5-2-6-1-1.5 1.5-2 5 .5 9s5 4.5 5.5 4.5 3 0 5.5-4.5S20 7.5 18.5 6c-1-1-4-2-6.5 1z" />
      <path d="M12 7c0-1 .5-3 2.5-4" />
    </svg>
  ),
  CalendarArrow: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <rect x="3" y="4" width="18" height="18" rx="3" />
      <path d="M16 2v4M8 2v4M3 10h12" />
      <path d="M16 16h5M19 14l2 2-2 2" />
    </svg>
  ),
  Copy: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Clock: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
    </svg>
  ),
  Person: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
    </svg>
  ),
  PersonOff: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
      <path d="M3 3l18 18" />
    </svg>
  ),
  Send: (p: IconProps = {}) => (
    <svg {...base} {...p}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
};
