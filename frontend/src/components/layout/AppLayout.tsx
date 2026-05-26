import { useState, type ReactNode } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { Icon } from "../sage/Icon";
import { Popover } from "../sage/Popover";
import { useMobile } from "../sage/useMobile";

const LANGUAGES = [
  { code: "lt", flag: "🇱🇹", native: "Lietuvių", en: "Lithuanian" },
  { code: "en", flag: "🇬🇧", native: "English", en: "English" },
];

interface NavItem {
  path: string;
  labelKey: string;
  icon: () => ReactNode;
  matchPrefixes?: string[];
}

const NAV: NavItem[] = [
  { path: "/planner", labelKey: "nav.planner", icon: Icon.Calendar },
  { path: "/recipes", labelKey: "nav.recipes", icon: Icon.Book },
  { path: "/shopping", labelKey: "nav.shopping", icon: Icon.Cart },
  { path: "/family", labelKey: "nav.family", icon: Icon.Users, matchPrefixes: ["/family", "/join"] },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();

  const [langAnchor, setLangAnchor] = useState<HTMLElement | null>(null);
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);

  const isActive = (n: NavItem) => {
    const prefixes = n.matchPrefixes ?? [n.path];
    return prefixes.some((p) => location.pathname.startsWith(p));
  };

  const displayName = user?.displayName ?? "";
  const userInitials = displayName ? initials(displayName) : "?";

  return (
    <div className={`fp-app ${isMobile ? "is-mobile" : ""}`}>
      <header className="fp-header">
        <div
          className="fp-brand"
          style={{ cursor: "pointer" }}
          onClick={() => navigate("/planner")}
        >
          <span className="fp-brand-mark">
            <Icon.Leaf />
          </span>
          <span>
            Food<b> Planning</b>
          </span>
        </div>
        <div className="fp-header-right">
          {!isMobile && (
            <button
              type="button"
              className="fp-user-chip"
              onClick={(e) => setUserAnchor(e.currentTarget)}
            >
              <span className="fp-user-avatar">{userInitials}</span>
              {displayName}
            </button>
          )}
          {isMobile && (
            <button
              type="button"
              className="fp-icon-btn"
              onClick={(e) => setUserAnchor(e.currentTarget)}
              aria-label="Account"
            >
              <span className="fp-user-avatar" style={{ width: 24, height: 24, fontSize: 11 }}>
                {userInitials}
              </span>
            </button>
          )}
          <button
            type="button"
            className="fp-icon-btn"
            onClick={(e) => setLangAnchor(e.currentTarget)}
            aria-label="Language"
          >
            <Icon.Globe />
          </button>
          <button
            type="button"
            className="fp-icon-btn"
            onClick={signOut}
            aria-label={t("auth.signOut")}
            title={t("auth.signOut")}
          >
            <Icon.Logout />
          </button>
        </div>
      </header>

      <div className="fp-body">
        {!isMobile && (
          <aside className="fp-sidenav">
            {NAV.map((n) => {
              const I = n.icon;
              return (
                <button
                  key={n.path}
                  type="button"
                  className={`fp-nav-item ${isActive(n) ? "is-active" : ""}`}
                  onClick={() => navigate(n.path)}
                >
                  <I />
                  <span>{t(n.labelKey)}</span>
                </button>
              );
            })}
            <div className="fp-nav-spacer" />
          </aside>
        )}

        <main className="fp-main">
          <Outlet />
        </main>
      </div>

      {isMobile && (
        <nav className="fp-bottomnav">
          {NAV.map((n) => {
            const I = n.icon;
            return (
              <button
                key={n.path}
                type="button"
                className={`fp-bottomnav-item ${isActive(n) ? "is-active" : ""}`}
                onClick={() => navigate(n.path)}
              >
                <I />
                <span>{t(n.labelKey)}</span>
              </button>
            );
          })}
        </nav>
      )}

      {langAnchor && (
        <Popover
          anchor={langAnchor}
          onClose={() => setLangAnchor(null)}
          className="fp-lang-popover"
        >
          <div className="fp-lang-popover-title">{t("lang.title")}</div>
          <div className="fp-lang-grid">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                className={`fp-lang-btn ${i18n.language?.startsWith(l.code) ? "is-active" : ""}`}
                onClick={() => {
                  void i18n.changeLanguage(l.code);
                  setLangAnchor(null);
                }}
              >
                <div className="fp-lang-row">
                  <span className="fp-lang-flag">{l.flag}</span>
                  <span className="fp-lang-en">{l.en}</span>
                </div>
                <span className="fp-lang-native">{l.native}</span>
              </button>
            ))}
          </div>
        </Popover>
      )}

      {userAnchor && (
        <Popover
          anchor={userAnchor}
          onClose={() => setUserAnchor(null)}
          className="fp-user-popover"
        >
          <div className="fp-user-popover-head">
            <span className="fp-user-avatar">{userInitials}</span>
            <div>
              <div className="fp-user-popover-name">{displayName}</div>
              <div className="fp-user-popover-email">{user?.email}</div>
            </div>
          </div>
          <button
            type="button"
            className="fp-popover-item"
            onClick={() => {
              setUserAnchor(null);
              navigate("/family");
            }}
          >
            <Icon.Users />
            {t("user.switchFamily")}
          </button>
          <div className="fp-popover-divider" />
          <button
            type="button"
            className="fp-popover-item is-danger"
            onClick={() => {
              setUserAnchor(null);
              signOut();
            }}
          >
            <Icon.Logout />
            {t("auth.signOut")}
          </button>
        </Popover>
      )}
    </div>
  );
}
