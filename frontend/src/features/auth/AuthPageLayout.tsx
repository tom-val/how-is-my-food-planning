import type { ReactNode } from "react";
import { LanguageSwitcher } from "../../components/shared/LanguageSwitcher";
import { Icon } from "../../components/sage/Icon";

export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fp-app">
      <div className="fp-auth">
        <div style={{ position: "absolute", top: 16, right: 16 }}>
          <LanguageSwitcher />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: 420,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
              fontFamily: "var(--font-display)",
              fontSize: 28,
              color: "var(--sage-800)",
              letterSpacing: "-0.01em",
            }}
          >
            <span
              className="fp-brand-mark"
              style={{ width: 44, height: 44, borderRadius: 14 }}
            >
              <Icon.Leaf style={{ width: 22, height: 22 }} />
            </span>
            <span>
              Food<b style={{ fontWeight: 500 }}> Planning</b>
            </span>
          </div>
          <div className="fp-auth-card">{children}</div>
        </div>
      </div>
    </div>
  );
}
