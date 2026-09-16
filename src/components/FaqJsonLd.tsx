import { JsonLdScript } from "@/components/JsonLdScript";

type Faq = { question: string; answer: string };

/**
 * FAQPage structured data. Mount next to a server-rendered FAQ list whose
 * questions and answers are visible on the page (Google requirement), e.g.
 * in about/page.tsx: `<FaqJsonLd faqs={faqs} />`.
 */
export function FaqJsonLd({ faqs }: { faqs: Faq[] }) {
  const items = faqs.filter((f) => f.question?.trim() && f.answer?.trim());
  if (items.length === 0) return null;
  const json = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      },
    })),
  };
  return <JsonLdScript data={json} />;
}
