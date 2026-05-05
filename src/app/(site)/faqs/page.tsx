import { PageContainer } from "@/components/ui/PageContainer";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";

export default async function FaqsPage() {
  const client = getConvexServer();
  const faqs = await client.query(api.faqs.listPublic, {});

  const categories = Array.from(new Set(faqs.map((f) => f.category))).sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <main className="min-h-screen bg-havezic-background-light/40">
      <PageContainer className="py-10">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-havezic-primary">
            Help center
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            FAQs
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Quick answers to common questions. If you need anything else, reach out from the
            Contact page.
          </p>

          {faqs.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-border bg-background p-6">
              <p className="text-sm text-muted">No FAQs yet.</p>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {categories.map((cat) => (
                <section
                  key={cat}
                  className="rounded-2xl border border-border bg-background shadow-sm"
                >
                  <div className="border-b border-border bg-havezic-background-light px-5 py-4">
                    <h2 className="text-sm font-semibold text-foreground">{cat}</h2>
                  </div>
                  <div className="divide-y divide-border">
                    {faqs
                      .filter((f) => f.category === cat)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((f) => (
                        <details key={f._id} className="group px-5 py-4">
                          <summary className="cursor-pointer list-none font-semibold text-foreground transition group-open:text-havezic-primary">
                            {f.question}
                          </summary>
                          <p className="mt-2 text-sm leading-relaxed text-muted">{f.answer}</p>
                        </details>
                      ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    </main>
  );
}

