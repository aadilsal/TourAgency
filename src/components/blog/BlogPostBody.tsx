import { cn } from "@/lib/cn";

/**
 * Renders post body: HTML when content looks like markup (admin/CMS), otherwise
 * paragraph-split plain text for readable “rich enough” display without a markdown dependency.
 */
export function BlogPostBody({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const trimmed = content.trim();
  const looksLikeHtml = /^<\s*[\w!]/i.test(trimmed);

  if (looksLikeHtml) {
    return (
      <div
        className={cn(
          "blog-content text-brand-muted [&_a]:font-medium [&_a]:text-brand-accent [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-brand-accent/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-brand-ink [&_h2]:first:mt-0 [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-brand-ink [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mb-4 [&_p]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-brand-ink [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }

  const blocks = content.split(/\n\n+/).filter(Boolean);
  return (
    <div className={cn("space-y-5 text-brand-muted", className)}>
      {blocks.map((block, i) => (
        <p key={i} className="leading-relaxed whitespace-pre-line">
          {block}
        </p>
      ))}
    </div>
  );
}
