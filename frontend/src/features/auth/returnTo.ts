// Return-location handling for the auth pages.
//
// Pages that send the user to /login (RequireAuth, the shared-recipe page) put
// the location to come back to in router state as `{ from }`. Router state lives
// in the history entry, not in the URL, so it can't be injected through a link;
// it is still validated so only same-app paths are ever followed.

interface FromLocation {
  pathname?: unknown;
  search?: unknown;
  hash?: unknown;
}

export interface ReturnToState {
  from: FromLocation;
}

export const DEFAULT_AFTER_SIGN_IN = "/planner";

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

/** The `{ from }` state to pass on between auth pages, or undefined if there is none. */
export function getReturnToState(state: unknown): ReturnToState | undefined {
  const from = (state as { from?: unknown } | null)?.from;
  return from && typeof from === "object" ? { from: from as FromLocation } : undefined;
}

/** Where to go after a successful sign-in: the `from` location if valid, else the default. */
export function getReturnPath(state: unknown): string {
  const from = getReturnToState(state)?.from;
  const pathname = from?.pathname;
  if (
    typeof pathname !== "string" ||
    !pathname.startsWith("/") ||
    pathname.startsWith("//") ||
    pathname.includes("\\") ||
    AUTH_PATHS.includes(pathname)
  ) {
    return DEFAULT_AFTER_SIGN_IN;
  }

  const search = typeof from?.search === "string" ? from.search : "";
  const hash = typeof from?.hash === "string" ? from.hash : "";
  return `${pathname}${search}${hash}`;
}
