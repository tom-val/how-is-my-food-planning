import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../sage/Icon";
import { Popover } from "../sage/Popover";

const LANGUAGES = [
  { code: "lt", flag: "🇱🇹", native: "Lietuvių", en: "Lithuanian" },
  { code: "en", flag: "🇬🇧", native: "English", en: "English" },
];

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <button
        type="button"
        className="fp-icon-btn"
        onClick={(e) => setAnchor(e.currentTarget)}
        aria-label="Language"
      >
        <Icon.Globe />
      </button>
      {anchor && (
        <Popover
          anchor={anchor}
          onClose={() => setAnchor(null)}
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
                  setAnchor(null);
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
    </>
  );
}
