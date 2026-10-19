import type { KnowBeforeYouGoBlock } from "@/lib/tours/knowBeforeYouGo";

/**
 * Renders parsed "Know before you go" blocks. No hooks, so it works on the
 * server-rendered tour page and in the admin editor's live preview.
 */
export function KnowBeforeYouGoContent({
  blocks,
  compact = false,
}: {
  blocks: KnowBeforeYouGoBlock[];
  compact?: boolean;
}) {
  const text = compact ? "text-sm" : "text-base";
  return (
    <div className={`space-y-4 ${text} leading-relaxed text-muted`}>
      {blocks.map((block, i) => {
        if (block.type === "heading") {
          return (
            <h3
              key={i}
              className={`font-bold text-foreground ${compact ? "text-sm" : "text-lg"} ${i > 0 ? "pt-2" : ""}`}
            >
              {block.text}
            </h3>
          );
        }
        if (block.type === "paragraph") {
          return <p key={i}>{block.text}</p>;
        }
        if (block.ordered) {
          return (
            <ol key={i} className="space-y-2.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-3">
                  <span
                    className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-havezic-primary/15 text-xs font-bold text-havezic-primary"
                    aria-hidden
                  >
                    {j + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul key={i} className="space-y-2.5">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-3">
                <span
                  className="mt-[0.6em] h-2 w-2 shrink-0 rounded-full bg-havezic-primary"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}
