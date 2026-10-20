/** Pure helpers behind `useRequiredFields` / `AdminField` (unit-tested). */

export const fieldHintId = (id: string) => `${id}-hint`;
export const fieldErrorMsgId = (id: string) => `${id}-error`;

/** Missing = undefined/null, blank or whitespace-only string, NaN, empty array. */
export function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  if (typeof value === "number") return Number.isNaN(value);
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
