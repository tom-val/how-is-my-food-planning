import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createRecipe, listRecipes } from "../../api/recipeApi";
import { IMPORT_RECIPES } from "./importData";
import { Icon } from "../../components/sage/Icon";
import { Spinner } from "../../components/sage/Spinner";

/**
 * One-time admin page to bulk-import the recipes extracted from "meal plan.xlsx".
 * Reads the bundled dataset in ./importData.ts and POSTs each recipe to /v1/recipes.
 * Idempotent: recipes whose name already exists in the family are skipped, so it is
 * safe to re-run. Delete this page, its route, and importData.ts once the import is done.
 */

type RowStatus = "pending" | "importing" | "done" | "skipped" | "error";
interface RowState {
  status: RowStatus;
  error?: string;
}

const CAT_LABEL: Record<string, string> = {
  breakfast: "Pusryčiai",
  lunch: "Pietūs",
  dinner: "Vakarienė",
  snack: "Užkandis",
};

const norm = (s: string) => s.trim().toLowerCase();

const BADGE: Record<RowStatus, { label: string; bg: string; ink: string }> = {
  pending: { label: "laukia", bg: "var(--sage-50)", ink: "var(--muted)" },
  importing: { label: "importuojama", bg: "var(--sage-100)", ink: "var(--sage-700)" },
  done: { label: "importuota", bg: "var(--sage-100)", ink: "var(--sage-700)" },
  skipped: { label: "praleista", bg: "var(--surface)", ink: "var(--muted)" },
  error: { label: "klaida", bg: "var(--danger-bg)", ink: "var(--danger)" },
};

export default function ImportRecipesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: listRecipes,
  });

  const existingNames = useMemo(
    () => new Set((existing ?? []).map((r) => norm(r.recipe.name))),
    [existing],
  );

  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [rows, setRows] = useState<Record<number, RowState>>({});
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  const isDuplicate = (i: number) => existingNames.has(norm(IMPORT_RECIPES[i].name));

  const plan = useMemo(() => {
    let toImport = 0;
    let dup = 0;
    IMPORT_RECIPES.forEach((_, i) => {
      if (isDuplicate(i)) {
        dup++;
        return;
      }
      if (!excluded.has(i)) toImport++;
    });
    return { toImport, dup };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingNames, excluded]);

  const counts = useMemo(() => {
    const c = { done: 0, skipped: 0, error: 0 };
    for (const r of Object.values(rows)) {
      if (r.status === "done") c.done++;
      else if (r.status === "skipped") c.skipped++;
      else if (r.status === "error") c.error++;
    }
    return c;
  }, [rows]);

  const attemptTotal = IMPORT_RECIPES.length - excluded.size;
  const processed = counts.done + counts.skipped + counts.error;
  const progress = attemptTotal ? processed / attemptTotal : 0;

  const toggle = (i: number) => {
    if (running) return;
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const toggleExpand = (i: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const runImport = async () => {
    setRunning(true);
    setFinished(false);
    setRows({});
    const seen = new Set(existingNames);
    for (let i = 0; i < IMPORT_RECIPES.length; i++) {
      const r = IMPORT_RECIPES[i];
      if (excluded.has(i)) continue;
      if (seen.has(norm(r.name))) {
        setRows((s) => ({ ...s, [i]: { status: "skipped" } }));
        continue;
      }
      setRows((s) => ({ ...s, [i]: { status: "importing" } }));
      try {
        await createRecipe(r.name, r.instructions, r.categories, r.ingredients);
        seen.add(norm(r.name));
        setRows((s) => ({ ...s, [i]: { status: "done" } }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setRows((s) => ({ ...s, [i]: { status: "error", error: msg } }));
      }
    }
    setRunning(false);
    setFinished(true);
    void queryClient.invalidateQueries({ queryKey: ["recipes"] });
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="fp-main-wide">
      <div className="fp-page-head">
        <div>
          <div className="fp-page-eyebrow">Vienkartinis importas</div>
          <h1>
            Importuoti <em>receptus</em>
          </h1>
          <div className="fp-page-sub">
            {IMPORT_RECIPES.length} receptai iš „meal plan.xlsx“. Jau esantys receptai
            (pagal pavadinimą) praleidžiami, tad importą saugu paleisti pakartotinai.
          </div>
        </div>
        <button
          type="button"
          className="fp-btn fp-btn-ghost"
          onClick={() => navigate("/recipes")}
          disabled={running}
        >
          <Icon.ArrowLeft />
          Į receptus
        </button>
      </div>

      {/* Control bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          padding: "14px 16px",
          border: "1px solid var(--hairline)",
          borderRadius: "var(--r-card)",
          background: "var(--surface)",
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: ".92rem", color: "var(--ink-2)" }}>
          <b style={{ color: "var(--ink)" }}>{plan.toImport}</b> bus importuota
          {plan.dup > 0 && (
            <>
              {" · "}
              <span style={{ color: "var(--muted)" }}>{plan.dup} jau yra</span>
            </>
          )}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            type="button"
            className="fp-btn fp-btn-ghost"
            onClick={() =>
              setExpanded((prev) =>
                prev.size === IMPORT_RECIPES.length
                  ? new Set()
                  : new Set(IMPORT_RECIPES.map((_, i) => i)),
              )
            }
          >
            <Icon.Chevron dir={expanded.size === IMPORT_RECIPES.length ? "up" : "down"} />
            {expanded.size === IMPORT_RECIPES.length ? "Suskleisti visus" : "Išskleisti visus"}
          </button>
          <button
            type="button"
            className="fp-btn fp-btn-primary"
            onClick={runImport}
            disabled={running || plan.toImport === 0}
          >
            {running ? <Spinner inline /> : <Icon.Forward />}
            {running
              ? `Importuojama… ${processed}/${attemptTotal}`
              : finished
                ? "Importuoti dar kartą"
                : `Importuoti (${plan.toImport})`}
          </button>
        </div>
      </div>

      {/* Progress */}
      {(running || finished) && (
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: "var(--sage-100)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round(progress * 100)}%`,
                background: "var(--sage-500)",
                transition: "width .25s ease",
              }}
            />
          </div>
          {finished && (
            <div style={{ marginTop: 10, fontSize: ".9rem", color: "var(--ink-2)" }}>
              Baigta: <b style={{ color: "var(--sage-700)" }}>{counts.done}</b> importuota
              {counts.skipped > 0 && ` · ${counts.skipped} praleista`}
              {counts.error > 0 && (
                <span style={{ color: "var(--danger)" }}> · {counts.error} klaidų</span>
              )}
              .{" "}
              <button
                type="button"
                className="fp-textbtn"
                onClick={() => navigate("/recipes")}
              >
                Peržiūrėti receptus
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recipe list */}
      <div
        style={{
          border: "1px solid var(--hairline)",
          borderRadius: "var(--r-card)",
          overflow: "hidden",
          background: "var(--surface)",
        }}
      >
        {IMPORT_RECIPES.map((r, i) => {
          const dup = isDuplicate(i);
          const state = rows[i];
          const isExcluded = excluded.has(i);
          const badge = state ? BADGE[state.status] : null;
          const isOpen = expanded.has(i);
          return (
            <div
              key={r.name}
              style={{
                borderTop: i === 0 ? "none" : "1px solid var(--hairline)",
                background: isOpen ? "var(--sage-50)" : undefined,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 16px",
                  opacity: isExcluded && !state ? 0.5 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={!isExcluded}
                  disabled={running}
                  onChange={() => toggle(i)}
                  style={{ width: 17, height: 17, accentColor: "var(--sage-600)", flexShrink: 0 }}
                  aria-label={r.name}
                />
                <button
                  type="button"
                  onClick={() => toggleExpand(i)}
                  aria-expanded={isOpen}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flex: 1,
                    minWidth: 0,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    textAlign: "left",
                    font: "inherit",
                    color: "inherit",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      color: "var(--muted)",
                      flexShrink: 0,
                    }}
                  >
                    <Icon.Chevron dir={isOpen ? "down" : "right"} />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span
                      style={{
                        display: "block",
                        fontWeight: 600,
                        color: "var(--ink)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {r.name}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        marginTop: 3,
                        flexWrap: "wrap",
                      }}
                    >
                      {r.categories.map((c) => (
                        <span
                          key={c}
                          style={{
                            fontSize: ".68rem",
                            fontWeight: 600,
                            padding: "1px 8px",
                            borderRadius: 999,
                            background: `var(--meal-${c})`,
                            color: `var(--meal-${c}-ink)`,
                          }}
                        >
                          {CAT_LABEL[c] ?? c}
                        </span>
                      ))}
                      <span style={{ fontSize: ".78rem", color: "var(--muted)" }}>
                        {r.ingredients.length} ingr.
                      </span>
                    </span>
                  </span>
                </button>
                {badge ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: ".72rem",
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: badge.bg,
                      color: badge.ink,
                      flexShrink: 0,
                    }}
                    title={state?.error}
                  >
                    {state?.status === "importing" && <Spinner inline />}
                    {state?.status === "done" && <Icon.Check />}
                    {badge.label}
                  </span>
                ) : dup ? (
                  <span
                    style={{
                      fontSize: ".72rem",
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: "var(--surface)",
                      color: "var(--muted)",
                      border: "1px solid var(--hairline)",
                      flexShrink: 0,
                    }}
                  >
                    jau yra
                  </span>
                ) : null}
              </div>

              {isOpen && (
                <div style={{ padding: "0 16px 14px 45px" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: ".86rem",
                      background: "var(--surface)",
                      border: "1px solid var(--hairline)",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <tbody>
                      {r.ingredients.map((ing, j) => (
                        <tr
                          key={`${ing.name}-${j}`}
                          style={{
                            borderTop: j === 0 ? "none" : "1px solid var(--hairline)",
                          }}
                        >
                          <td style={{ padding: "5px 12px", color: "var(--ink-2)" }}>
                            {ing.name}
                          </td>
                          <td
                            style={{
                              padding: "5px 8px",
                              textAlign: "right",
                              whiteSpace: "nowrap",
                              color: "var(--ink)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {ing.quantity ?? ""}
                          </td>
                          <td
                            style={{
                              padding: "5px 12px 5px 4px",
                              color: "var(--muted)",
                              whiteSpace: "nowrap",
                              width: "1%",
                            }}
                          >
                            {ing.unit ?? ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
