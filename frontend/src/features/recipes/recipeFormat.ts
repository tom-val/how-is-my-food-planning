/** Splits a recipe name so the last word can be styled as the accent. */
export function splitTitle(name: string): { head: string; tail: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { head: "", tail: parts[0] };
  return { head: parts.slice(0, -1).join(" "), tail: parts.slice(-1)[0] };
}

/** True when the whole text is a single http(s) link (e.g. a source recipe URL). */
export function isUrl(text: string): boolean {
  return /^https?:\/\//i.test(text.trim());
}

// Leading "1." / "1)" numbering or a bullet the author typed themselves.
const STEP_PREFIX = /^\s*(?:\d{1,2}[.)]|[-*•])\s+/;

/**
 * Splits free-text instructions into steps, one per non-empty line, dropping
 * any numbering/bullets already present so they can be renumbered.
 */
export function splitSteps(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(STEP_PREFIX, "").trim())
    .filter((line) => line.length > 0);
}
