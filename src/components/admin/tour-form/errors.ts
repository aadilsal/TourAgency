import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";

/**
 * Pulls the human message out of a Convex error
 * ("[CONVEX M(x)] [Request ID: …] Server Error Uncaught Error: <msg> at … Called by client").
 */
export function extractServerErrorMessage(err: unknown): string {
  const data = (err as { data?: unknown } | null)?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const m = raw.match(
    /Uncaught (?:Error|ConvexError):\s*([\s\S]*?)(?:\s+at\s+\S+\s*\(|\s*Called by client|$)/,
  );
  return (m ? m[1]! : raw).trim();
}

/** Admin-actionable messages the backend writes on purpose; shown verbatim. */
const ACTIONABLE = [
  /changed by someone else/i,
  /already used by another tour/i,
  /can't be deleted/i,
  /slug already exists/i,
  /title can't be empty/i,
];

export function isTourConflictError(err: unknown): boolean {
  return /changed by someone else/i.test(extractServerErrorMessage(err));
}

/** Like `toUserFacingErrorMessage`, but never hides deliberate admin guidance. */
export function adminErrorMessage(err: unknown): string {
  const msg = extractServerErrorMessage(err);
  if (msg && ACTIONABLE.some((re) => re.test(msg))) return msg;
  return toUserFacingErrorMessage(err);
}
