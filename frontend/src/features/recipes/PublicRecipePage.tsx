import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import axios from "axios";
import { copySharedRecipe, getPublicRecipe } from "../../api/recipeApi";
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
import { BookmarkIcon, LinkIcon } from "./shareIcons";

function isNotFound(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

/**
 * Our API's 403 for a signed-in user who has no family yet. API Gateway's own
 * 403 (rejected token) has no `error` field, so it is not mistaken for this.
 */
function isNoFamily(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) return false;
  const body = error.response.data as { error?: unknown } | undefined;
  return typeof body?.error === "string";
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
 * Public view of a shared recipe at /share/:token.
 * Rendered outside RequireAuth/AppLayout: it never redirects to login, and the
 * recipe itself is loaded anonymously (getPublicRecipe uses a bare client).
 * The only authenticated call is the explicit "Save to my recipes" action for
 * signed-in users; signed-out users are offered sign-in, which returns here.
 */
export default function PublicRecipePage() {
  const { t } = useTranslation();
  const { token = "" } = useParams<{ token: string }>();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
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

  // Set synchronously on click, so a fast double click can't start a second
  // copy before the re-render disables the button.
  const savingRef = useRef(false);
  const save = useMutation({
    mutationFn: () => copySharedRecipe(token),
    onSuccess: ({ recipeId, alreadyOwned }) => {
      void queryClient.invalidateQueries({ queryKey: ["recipes"] });
      // Either way the recipe is now in the user's recipes, so both are a success.
      enqueueSnackbar(
        t(alreadyOwned ? "share.public.saveAlreadyOwned" : "share.public.saved"),
        { variant: "success" },
      );
      navigate(`/recipes/${recipeId}`);
    },
    onError: (err) => {
      // No family yet: explained inline below the hero, with a link to /family.
      if (isNoFamily(err)) return;
      if (isNotFound(err)) {
        // Sharing was stopped after the page loaded: show the "no longer
        // available" state instead of a recipe that can't be saved.
        enqueueSnackbar(t("share.public.saveGone"), { variant: "warning" });
        void queryClient.resetQueries({ queryKey: ["publicRecipe", token] });
        return;
      }
      enqueueSnackbar(t("share.public.saveError"), { variant: "error" });
    },
    onSettled: () => {
      savingRef.current = false;
    },
  });

  const handleSave = () => {
    if (savingRef.current) return;
    savingRef.current = true;
    save.mutate();
  };

  const needsFamily = save.isError && isNoFamily(save.error);
  const noFamilyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // The save button may be far down the page (bottom CTA), so bring the notice into view.
    if (needsFamily) {
      noFamilyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [needsFamily]);

  const saveButton = (
    <button
      type="button"
      className="fp-btn fp-btn-primary"
      onClick={handleSave}
      disabled={save.isPending}
      aria-busy={save.isPending}
    >
      <BookmarkIcon />
      {save.isPending ? t("share.public.saving") : t("share.public.save")}
    </button>
  );

  // Until the session check finishes we don't know which action applies, so
  // render neither rather than flashing "Sign in to save" for signed-in users.
  let saveAction: ReactNode = null;
  if (!isAuthLoading) {
    saveAction = isAuthenticated ? (
      saveButton
    ) : (
      <Link to="/login" state={{ from: location }} className="fp-btn fp-btn-primary">
        <BookmarkIcon />
        {t("share.public.signInToSave")}
      </Link>
    );
  }

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
            {saveAction}
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

        {needsFamily && (
          <div ref={noFamilyRef} className="fp-alert fp-public-notice no-print" role="alert">
            <span>{t("share.public.saveNoFamily")}</span>
            <Link to="/family" className="fp-btn fp-btn-primary">
              {t("share.public.saveNoFamilyLink")}
            </Link>
          </div>
        )}

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

          {!isAuthLoading && (
            <aside className="fp-public-cta no-print">
              {isAuthenticated && data ? (
                // Signed in: the end-of-recipe prompt is about keeping this
                // recipe, not about signing up for the app they already use.
                <>
                  <div className="fp-public-cta-body">
                    <div className="fp-public-cta-title">{t("share.public.saveCtaTitle")}</div>
                    <div className="fp-public-cta-text">{t("share.public.saveCtaMessage")}</div>
                  </div>
                  <div className="fp-public-cta-actions">
                    <Link to="/recipes" className="fp-textbtn">
                      {t("share.public.ctaOpenApp")}
                    </Link>
                    {saveButton}
                  </div>
                </>
              ) : (
                <>
                  <div className="fp-public-cta-body">
                    <div className="fp-public-cta-title">{t("share.public.ctaTitle")}</div>
                    <div className="fp-public-cta-text">{t("share.public.ctaMessage")}</div>
                  </div>
                  {isAuthenticated ? (
                    <Link to="/recipes" className="fp-btn fp-btn-ghost">
                      {t("share.public.ctaOpenApp")}
                    </Link>
                  ) : (
                    // Both routes come back to this recipe after signing in.
                    <div className="fp-public-cta-actions">
                      <Link to="/login" state={{ from: location }} className="fp-textbtn">
                        {t("share.public.ctaLogin")}
                      </Link>
                      <Link to="/register" state={{ from: location }} className="fp-btn fp-btn-primary">
                        {t("share.public.ctaRegister")}
                      </Link>
                    </div>
                  )}
                </>
              )}
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
