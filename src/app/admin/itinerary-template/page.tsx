import { AdminItineraryTemplatePanel } from "@/components/admin/AdminItineraryTemplatePanel";

export default function AdminItineraryTemplatePage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-brand-ink">Itinerary template</h1>
      <p className="mt-1 text-sm text-muted">
        Payment terms, bank details and terms &amp; conditions printed on every trip plan PDF.
      </p>
      <div className="mt-8">
        <AdminItineraryTemplatePanel />
      </div>
    </main>
  );
}
