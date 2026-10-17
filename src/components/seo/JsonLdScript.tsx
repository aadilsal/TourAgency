/**
 * Renders a JSON-LD <script>. Escapes "<" so CMS-provided strings (tour titles,
 * blog descriptions) can never close the script tag early (XSS-safe).
 */
export function JsonLdScript({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
