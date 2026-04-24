"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { isoDateRangeLabel } from "@/lib/dates";
import { Modal } from "@/components/ui/Modal";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { ItineraryPdf, type ItineraryPdfModel } from "@/documents/itinerary/ItineraryPdf";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { toAbsoluteUrl } from "@/lib/absoluteUrl";
import { cn } from "@/lib/cn";
import { PopoverMenu } from "@/components/ui/PopoverMenu";

type ActivityIcon = "flight" | "hotel" | "food" | "sightseeing";
type ItineraryDoc = {
  _id: Id<"itineraries">;
  headline: string;
  variantLabel: string;
  coverSubtitle: string;
  complianceLine: string;
  licenceNumber: string;
  pickupDropoff: string;
  title: string;
  clientName: string;
  startDate: string;
  endDate: string;
  days: number;
  status: "draft" | "final";
  coverImageStorageId?: Id<"_storage">;
  companyDescription?: string;
  logoStorageId?: Id<"_storage">;
  affiliationsStorageIds?: Id<"_storage">[];
  contactPhone?: string;
  contactEmail?: string;
  contactWebsite?: string;
  destinations?: string[];
  transportType?: string;
  accommodationType?: string;
  mealsIncluded?: string;
  dayPlans?: Array<{
    dayNumber: number;
    title: string;
    imageStorageId?: Id<"_storage">;
    highlights?: string[];
    overnight?: string;
    morning: Array<{ title: string; description: string; icon: ActivityIcon }>;
    afternoon: Array<{ title: string; description: string; icon: ActivityIcon }>;
    evening: Array<{ title: string; description: string; icon: ActivityIcon }>;
  }>;
  included?: string[];
  notIncluded?: string[];
  importantNotes?: string;
  packages?: Array<{
    name: string;
    pricePkr?: number;
    vehicle?: string;
    note?: string;
    stays?: Array<{ location: string; hotel: string; nights: number }>;
  }>;
  paymentTerms?: Array<{ percent: number; title: string; description?: string }>;
  bankDetails?: {
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    instruction?: string;
  };
  termsBlocks?: Array<{ title: string; body: string }>;
};

export function AdminItineraryDetail({ itineraryId }: { itineraryId: string }) {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const [previewOpen, setPreviewOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const itin = useQuery(
    api.itineraries.getForAdmin,
    canQuery
      ? { sessionToken, itineraryId: itineraryId as Id<"itineraries"> }
      : "skip",
  ) as ItineraryDoc | null | undefined;

  const createFromItinerary = useMutation(api.invoices.createFromItinerary);
  const markFinal = useMutation(api.itineraries.markFinal);
  const resolveUrls = useQuery(
    api.media.resolveStorageIdsForAdmin,
    canQuery && itin
      ? {
          sessionToken,
          ids: ([
            itin.coverImageStorageId,
            itin.logoStorageId,
            ...(itin.affiliationsStorageIds ?? []),
            ...((itin.dayPlans ?? []).map((d) => d.imageStorageId).filter(Boolean) ??
              []),
          ].filter((x): x is Id<"_storage"> => Boolean(x)) as unknown as string[]),
        }
      : "skip",
  ) as (string | null)[] | undefined;

  const publicSettings = useQuery(api.siteSettings.getPublicSiteSettings, {});

  const urlCursor = useMemo(() => {
    const ids = itin
      ? ([
          itin.coverImageStorageId,
          itin.logoStorageId,
          ...(itin.affiliationsStorageIds ?? []),
          ...((itin.dayPlans ?? []).map((d) => d.imageStorageId).filter(Boolean) ??
            []),
        ].filter(Boolean) as string[])
      : [];
    const urls = resolveUrls ?? [];
    const map = new Map<string, string | null>();
    for (let i = 0; i < ids.length; i++) map.set(String(ids[i]), urls[i] ?? null);
    return map;
  }, [itin, resolveUrls]);

  const pdfModel: ItineraryPdfModel | null = useMemo(() => {
    if (!itin) return null;
    const safeDays = Math.max(1, itin.days || 1);
    const nights = Math.max(0, safeDays - 1);
    return {
      headline: itin.headline,
      variantLabel: itin.variantLabel,
      tripTitle: itin.title,
      coverSubtitle: itin.coverSubtitle || undefined,
      clientName: itin.clientName ?? "",
      dateRangeLabel: isoDateRangeLabel(itin.startDate, itin.endDate),
      nightsLabel: `${nights}-Night`,
      daysLabel: `${safeDays}-Day`,
      pickupDropoff: itin.pickupDropoff || undefined,
      complianceLine: itin.complianceLine || undefined,
      licenceNumber:
        itin.licenceNumber?.trim() ||
        (publicSettings as { governmentLicenseNo?: string } | undefined)?.governmentLicenseNo?.trim() ||
        undefined,
      contact: {
        phone: itin.contactPhone,
        email: itin.contactEmail,
        website: itin.contactWebsite,
        officeAddress: publicSettings?.officeAddress?.trim() || undefined,
      },
      coverImageUrl: itin.coverImageStorageId
        ? toAbsoluteUrl(urlCursor.get(String(itin.coverImageStorageId)) ?? null)
        : null,
      logoUrl: itin.logoStorageId
        ? toAbsoluteUrl(urlCursor.get(String(itin.logoStorageId)) ?? null)
        : toAbsoluteUrl("/images-removebg-preview.png"),
      dayPlans: (itin.dayPlans ?? []).map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        imageUrl: d.imageStorageId
          ? toAbsoluteUrl(urlCursor.get(String(d.imageStorageId)) ?? null)
          : null,
        highlights: d.highlights ?? [],
        overnight: d.overnight ?? undefined,
        morning: (d.morning ?? []).map((a) => ({ title: a.title, description: a.description })),
        afternoon: (d.afternoon ?? []).map((a) => ({ title: a.title, description: a.description })),
        evening: (d.evening ?? []).map((a) => ({ title: a.title, description: a.description })),
      })),
      included: itin.included ?? [],
      notIncluded: itin.notIncluded ?? [],
      packages: (itin.packages ?? []).map((p) => ({
        name: p.name,
        priceLabel: p.pricePkr ? `PKR ${p.pricePkr.toLocaleString()}` : "PKR —",
        vehicle: p.vehicle?.trim() || undefined,
        stays: (p.stays ?? []).map((s) => ({
          location: s.location,
          hotel: s.hotel,
          nights: s.nights,
        })),
        note: p.note?.trim() || undefined,
      })),
      paymentTerms: itin.paymentTerms ?? [],
      bankDetails: itin.bankDetails,
      termsBlocks: itin.termsBlocks ?? [],
    };
  }, [itin, urlCursor, publicSettings]);

  if (!canQuery) {
    return (
      <p className="text-sm text-amber-800">
        {sessionToken === undefined
          ? "Loading your session…"
          : "You need an admin session to view itineraries."}
      </p>
    );
  }

  if (itin === undefined) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (!itin) {
    return <p className="text-sm text-muted">Itinerary not found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-ink">{itin.title}</h1>
          <p className="mt-1 text-sm text-brand-muted">
            {itin.clientName || "—"} · {isoDateRangeLabel(itin.startDate, itin.endDate)} ·{" "}
            {itin.days} days
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          <Link href="/admin/itineraries" className="sm:order-1">
            <Button type="button" variant="secondary" className="w-full sm:w-auto">
              Back to list
            </Button>
          </Link>

          {pdfModel ? (
            <PDFDownloadLink
              document={<ItineraryPdf model={pdfModel} />}
              fileName={`${itin.title.replace(/\s+/g, "-").toLowerCase()}.pdf`}
            >
              {({ loading }) => (
                <Button type="button" disabled={loading} className="w-full sm:w-auto">
                  {loading ? "Preparing…" : "Download PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          ) : null}

          <div className="sm:hidden">
            <PopoverMenu
              buttonLabel="More actions"
              buttonClassName={cn(
                "w-full",
                "inline-flex items-center justify-center",
                "rounded-xl border border-border bg-panel px-5 py-2.5 text-sm font-semibold text-foreground",
              )}
              items={[
                { label: "Preview", onClick: () => setPreviewOpen(true) },
                {
                  label: "Mark final",
                  onClick: () => {
                    void (async () => {
                      try {
                        await markFinal({
                          sessionToken,
                          itineraryId: itin._id as Id<"itineraries">,
                        });
                        setMsg("Marked as final.");
                      } catch (e) {
                        setMsg(toUserFacingErrorMessage(e));
                      }
                    })();
                  },
                },
                {
                  label: "Generate invoice",
                  onClick: () => {
                    void (async () => {
                      try {
                        const invoiceId = await createFromItinerary({
                          sessionToken,
                          itineraryId: itin._id as Id<"itineraries">,
                        });
                        window.dispatchEvent(new Event("jt:routing:start"));
                        window.location.href = `/admin/invoices/${invoiceId}`;
                      } catch (e) {
                        setMsg(toUserFacingErrorMessage(e));
                      }
                    })();
                  },
                },
              ]}
            />
          </div>

          {/* Desktop/tablet: keep buttons visible */}
          <div className="hidden sm:flex sm:flex-wrap sm:gap-2">
            <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
              Preview
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void (async () => {
                  try {
                    await markFinal({
                      sessionToken,
                      itineraryId: itin._id as Id<"itineraries">,
                    });
                    setMsg("Marked as final.");
                  } catch (e) {
                    setMsg(toUserFacingErrorMessage(e));
                  }
                })();
              }}
            >
              Mark final
            </Button>
            <Button
              type="button"
              onClick={() => {
                void (async () => {
                  try {
                    const invoiceId = await createFromItinerary({
                      sessionToken,
                      itineraryId: itin._id as Id<"itineraries">,
                    });
                    window.dispatchEvent(new Event("jt:routing:start"));
                    window.location.href = `/admin/invoices/${invoiceId}`;
                  } catch (e) {
                    setMsg(toUserFacingErrorMessage(e));
                  }
                })();
              }}
            >
              Generate invoice
            </Button>
          </div>
        </div>
      </div>

      {msg ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {msg}
        </div>
      ) : null}

      <Card className="p-5">
        <p className="text-sm font-semibold text-foreground">Status</p>
        <p className="mt-1 text-sm text-muted">
          {itin.status === "final" ? "Final" : "Draft"}
        </p>
      </Card>

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Itinerary preview"
        description="This is the PDF preview."
        panelClassName="max-w-5xl"
      >
        <div className="h-[75vh] overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {pdfModel ? (
            <PDFViewer style={{ width: "100%", height: "100%" }}>
              <ItineraryPdf model={pdfModel} />
            </PDFViewer>
          ) : (
            <p className="p-4 text-sm text-muted">Preparing…</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

