/**
 * Parses the admin's "Know before you go" text into display blocks.
 *
 * Format (one item per line, blank lines ignored):
 * - `- text`, `• text` or `* text` → bullet point
 * - `1. text` or `1) text`         → numbered point
 * - a line ending with `:`         → small heading
 * - anything else                  → paragraph
 *
 * Consecutive bullet (or numbered) lines are grouped into one list.
 */
export type KnowBeforeYouGoBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

const BULLET = /^[-•*]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;

export function parseKnowBeforeYouGo(raw: string | undefined | null): KnowBeforeYouGoBlock[] {
  const blocks: KnowBeforeYouGoBlock[] = [];
  for (const rawLine of (raw ?? "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const bullet = line.match(BULLET);
    const numbered = bullet ? null : line.match(NUMBERED);
    const item = (bullet?.[1] ?? numbered?.[1])?.trim();
    if (item) {
      const ordered = Boolean(numbered);
      const last = blocks[blocks.length - 1];
      if (last?.type === "list" && last.ordered === ordered) last.items.push(item);
      else blocks.push({ type: "list", ordered, items: [item] });
    } else if (line.endsWith(":") && line.length > 1) {
      blocks.push({ type: "heading", text: line.slice(0, -1).trim() });
    } else {
      blocks.push({ type: "paragraph", text: line });
    }
  }
  return blocks;
}
