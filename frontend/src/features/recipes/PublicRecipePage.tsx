import { useEffect, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getPublicRecipe } from "../../api/recipeApi";
import { useAuth } from "../../hooks/useAuth";
import { Icon } from "../../components/sage/Icon";
import { Spinner } from "../../components/sage/Spinner";
import { useMobile } from "../../components/sage/useMobile";
import { LanguageSwitcher } from "../../components/shared/LanguageSwitcher";
import {
  RecipeCategoryTags,
  RecipeIngredientList,
  RecipeInstructions,
  RecipeTitle,
} from "./RecipeContent";
import { LinkIcon } from "./shareIcons";

function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

/** Sets document.title while mounted and restores the previous title afterwards. */
function useDocumentTitle(title: string | null) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

/** Asks search engines not to index shared links (they're private-by-obscurity). */
function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
}

/**
 * Public, read-only view of a shared recipe at /share/:token.
 * Rendered outside RequireAuth/AppLayout: it never redirects to login and
 * makes no authenticated API calls (getPublicRecipe uses a bare client).
 */
export default function PublicRecipePage() {
  const { t } = useTranslation();
  const { token = "" } = useParams<{ token: string }>();
  const { isAuthenticated } = useAuth();
  const isMobile = useMobile();
  useNoIndex();

  const { data, error, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["publicRecipe", token],
    queryFn: () => getPublicRecipe(token),
    enabled: token.length > 0,
    // A 404 means "not shared (any more)": retrying will not change that.
    retry: (failureCount, err) => !isNotFound(err) && failureCount < 1,
  });

  useDocumentTitle(data ? `${data.name} · ${t("app.title")}` : null);

  let content: ReactNode;
  if (isLoading) {
    content = <Spinner />;
  } else if (data) {
    content = (
      <>
        <div className="fp-recipe-hero">
          <div className="fp-recipe-hero-inner">
            <div className="fp-public-eyebrow">
              <LinkIcon />
              {t("share.public.eyebrow")}
            </div>
            <RecipeTitle name={data.name} />
            <div className="fp-recipe-hero-tags">
              <RecipeCategoryTags categories={data.categories} />
            </div>
          </div>
          <div className="fp-recipe-hero-actions">
            <button
              type="button"
              className="fp-btn fp-btn-ghost"
              onClick={() => window.print()}
            >
              <Icon.Printer />
              {t("share.public.print")}
            </button>
          </div>
        </div>

        <RecipeIngredientList ingredients={data.ingredients} />

        <div className="fp-section-title">{t("recipes.instructions")}</div>
        {data.instructions ? (
          <RecipeInstructions text={data.instructions} numbered />
        ) : (
          <div className="fp-instructions" style={{ color: "var(--muted)" }}>
            {t("share.public.noInstructions")}
          </div>
        )}
      </>
    );
  } else {
    const gone = !token || isNotFound(error);
    content = (
      <div className="fp-emptystate">
        <div className="fp-emptystate-mark">
          {gone ? <LinkIcon /> : <Icon.Refresh />}
        </div>
        <div className="fp-emptystate-title">
          {gone ? t("share.public.notFoundTitle") : t("share.public.errorTitle")}
        </div>
        <div className="fp-emptystate-sub">
          {gone ? t("share.public.notFoundMessage") : t("share.public.errorMessage")}
        </div>
        {!gone && (
          <div style={{ marginTop: 18 }}>
            <button
              type="button"
              className="fp-btn fp-btn-primary"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              <Icon.Refresh />
              {t("share.retry")}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`fp-app fp-public ${isMobile ? "is-mobile" : ""}`}>
      <header className="fp-header">
        <Link to="/" className="fp-brand fp-public-brand">
          <span className="fp-brand-mark">
            <Icon.Leaf />
          </span>
          <span>
            Food<b> Planning</b>
          </span>
        </Link>
        <div className="fp-header-right">
          <LanguageSwitcher />
        </div>
      </header>

      <main className="fp-main">
        <div className="fp-main-wide">
          {content}

          <aside className="fp-public-cta no-print">
            <div className="fp-public-cta-body">
              <div className="fp-public-cta-title">{t("share.public.ctaTitle")}</div>
              <div className="fp-public-cta-text">{t("share.public.ctaMessage")}</div>
            </div>
            {isAuthenticated ? (
              <Link to="/recipes" className="fp-btn fp-btn-ghost">
                {t("share.public.ctaOpenApp")}
              </Link>
            ) : (
              <div className="fp-public-cta-actions">
                <Link to="/login" className="fp-textbtn">
                  {t("share.public.ctaLogin")}
                </Link>
                <Link to="/register" className="fp-btn fp-btn-primary">
                  {t("share.public.ctaRegister")}
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
