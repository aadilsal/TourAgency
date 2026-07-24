"use client";

import { useEffect, useState } from "react";
import { AdminTourForm } from "@/components/admin/AdminTourForm";
import { TOUR_PDF_DRAFT_STORAGE_KEY } from "@/lib/tour-draft";
import type { TourPdfImportDraft } from "@/lib/tourPdf/types";

export default function NewTourPage() {
  const [draft, setDraft] = useState<TourPdfImportDraft | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(TOUR_PDF_DRAFT_STORAGE_KEY);
      if (raw) {
        setDraft(JSON.parse(raw) as TourPdfImportDraft);
        sessionStorage.removeItem(TOUR_PDF_DRAFT_STORAGE_KEY);
      }
    } catch {
      /* ignore malformed draft */
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">New tour</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Create a tour with its itinerary, images, and pricing.
      </p>
      <div className="mt-8">
        <AdminTourForm mode="create" initialDraft={draft} />
      </div>
    </main>
  );
}
