/** Add N days to a date (returns a new Date). */
export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

/** ISO week number for a given date. */
export function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Pretty week-range label like "26 May — 1 Jun". */
export function weekRangeLabel(monday: Date, locale?: string): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const day = (d: Date) => d.getDate();
  const month = (d: Date) => d.toLocaleDateString(locale, { month: "short" });
  if (sameMonth) return `${day(monday)} — ${day(sunday)} ${month(sunday)}`;
  return `${day(monday)} ${month(monday)} — ${day(sunday)} ${month(sunday)}`;
}

/** Offset-aware week label split into head + tail (e.g. {head:"This", tail:"week"}). */
export interface WeekLabelParts {
  head: string;
  tail: string;
}

export function weekOffsetLabel(
  offset: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
): WeekLabelParts {
  if (offset === 0) return { head: t("planner.weekLabel.thisHead"), tail: t("planner.weekLabel.thisTail") };
  if (offset === -1) return { head: t("planner.weekLabel.lastHead"), tail: t("planner.weekLabel.lastTail") };
  if (offset === 1) return { head: t("planner.weekLabel.nextHead"), tail: t("planner.weekLabel.nextTail") };
  if (offset < 0) return { head: String(Math.abs(offset)), tail: t("planner.weekLabel.weeksAgo") };
  return { head: String(offset), tail: t("planner.weekLabel.weeksAhead") };
}

/** Convert a "YYYY-MM-DD" Monday date to a Date in local time (no UTC drift). */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Day-of-week names from a Monday: returns 7 day entries with name/date/today/past. */
export interface DayInfo {
  name: string;
  date: string; // pretty short e.g. "26 May"
  isToday: boolean;
  isPast: boolean;
  isoDate: string; // YYYY-MM-DD
}

export function buildWeekDays(
  monday: Date,
  t: (key: string) => string,
  locale?: string,
): DayInfo[] {
  const dayKeys = ["days.mon", "days.tue", "days.wed", "days.thu", "days.fri", "days.sat", "days.sun"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    d.setHours(0, 0, 0, 0);
    return {
      name: t(dayKeys[i]),
      date: d.toLocaleDateString(locale, { day: "numeric", month: "short" }),
      isToday: d.getTime() === today.getTime(),
      isPast: d.getTime() < today.getTime(),
      isoDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    };
  });
}
