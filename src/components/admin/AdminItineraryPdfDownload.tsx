"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvexSessionToken } from "@/hooks/useConvexSessionToken";
import { isoDateRangeLabel } from "@/lib/dates";
import { toAbsoluteUrl } from "@/lib/absoluteUrl";
import { toUserFacingErrorMessage } from "@/lib/userFriendlyError";
import { ItineraryPdf, type ItineraryPdfModel } from "@/documents/itinerary/ItineraryPdf";
import {
  alignHotelsToRows,
  tiersToPackagesForPdf,
  type PackageTier,
} from "@/lib/itineraryPackageMatrix";
import { pdf } from "@react-pdf/renderer";
import Link from "next/link";

function pickMapFallbackImage(input: string) {
  const v = input.toLowerCase();
  if (v.includes("hunza")) return "hunza.jpg";
  if (v.includes("gilgit")) return "gilgit.jpg";
  if (v.includes("khunjerab") || v.includes("khunerjab")) return "Khunerjab.jpg";
  if (v.includes("islamabad")) return "islamabad.jpg";
  if (v.includes("lahore")) return "lahore.jpg";
  if (v.includes("karachi")) return "karachi.jpg";
  return "hunza.jpg";
}

type ActivityIcon = "flight" | "hotel" | "food" | "sightseeing";
type ItineraryDoc = {
  _id: Id<"itineraries">;
  layoutVariant?: "simple" | "advanced";
  atGlanceDays?: Array<{ dayNumber: number; title: string; detail: string; overnight?: string }>;
  packageStayRows?: Array<{ location: string }>;
  packageTiers?: PackageTier[];
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
  logoStorageId?: Id<"_storage">;
  affiliationsStorageIds?: Id<"_storage">[];
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
  contactPhone?: string;
  contactEmail?: string;
  contactWebsite?: string;
};

export function AdminItineraryPdfDownload({ itineraryId }: { itineraryId: string }) {
  const sessionToken = useConvexSessionToken();
  const canQuery = typeof sessionToken === "string";
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const didRun = useRef(false);

  const itin = useQuery(
    api.itineraries.getForAdmin,
    canQuery ? { sessionToken, itineraryId: itineraryId as Id<"itineraries"> } : "skip",
  ) as ItineraryDoc | null | undefined;

  const resolveUrls = useQuery(
    api.media.resolveStorageIdsForAdmin,
    canQuery && itin
      ? {
          sessionToken,
          ids: ([
            itin.coverImageStorageId,
            itin.logoStorageId,
            ...(itin.affiliationsStorageIds ?? []),
            ...((itin.dayPlans ?? []).map((d) => d.imageStorageId).filter(Boolean) ?? []),
          ].filter((x): x is Id<"_storage"> => Boolean(x)) as unknown as string[]),
        }
      : "skip",
  ) as (string | null)[] | undefined;

  const publicSettings = useQuery(api.siteSettings.getPublicSiteSettings, {});
  const adminSettings = useQuery(
    api.siteSettings.getAdminSiteSettings,
    canQuery ? { sessionToken } : "skip",
  );

  const urlCursor = useMemo(() => {
    const ids = itin
      ? ([
          itin.coverImageStorageId,
          itin.logoStorageId,
          ...(itin.affiliationsStorageIds ?? []),
          ...((itin.dayPlans ?? []).map((d) => d.imageStorageId).filter(Boolean) ?? []),
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
    const isSimple = itin.layoutVariant === "simple";
    const mapFallback = pickMapFallbackImage([itin.title, itin.pickupDropoff].filter(Boolean).join(" "));

    if (isSimple) {
      if (!adminSettings) return null;
      const rows =
        itin.packageStayRows && itin.packageStayRows.length > 0 ? itin.packageStayRows : [{ location: "" }];
      const rawTiers = itin.packageTiers ?? [];
      const tiers = rawTiers.length ? alignHotelsToRows(rawTiers, rows.length) : [];
      const packages = tiers.length ? tiersToPackagesForPdf(rows, tiers) : [];
      return {
        layoutVariant: "simple",
        includeEmptySections: true,
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
          (adminSettings as { governmentLicenseNo?: string }).governmentLicenseNo?.trim() ||
          itin.licenceNumber?.trim() ||
          undefined,
        companyName: "JunketTours",
        contact: {
          phone: adminSettings.whatsappPhone?.trim() || undefined,
          email: adminSettings.contactEmail?.trim() || undefined,
          website: (adminSettings as { website?: string }).website?.trim() || undefined,
          officeAddress: adminSettings.officeAddress?.trim() || undefined,
        },
        coverImageUrl: itin.coverImageStorageId
          ? toAbsoluteUrl(urlCursor.get(String(itin.coverImageStorageId)) ?? null)
          : toAbsoluteUrl(`/maps/${mapFallback}`),
        logoUrl: itin.logoStorageId
          ? toAbsoluteUrl(urlCursor.get(String(itin.logoStorageId)) ?? null)
          : toAbsoluteUrl("/images-removebg-preview.png"),
        atGlanceDays: itin.atGlanceDays ?? [],
        dayPlans: [],
        included: itin.included ?? [],
        notIncluded: itin.notIncluded ?? [],
        packages,
        paymentTerms: adminSettings.paymentTerms ?? [],
        bankDetails: adminSettings.bankDetails,
        termsBlocks: adminSettings.termsBlocks ?? [],
      };
    }

    return {
      layoutVariant: "advanced",
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
        imageUrl: d.imageStorageId ? toAbsoluteUrl(urlCursor.get(String(d.imageStorageId)) ?? null) : null,
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
        priceLabel: p.pricePkr != null ? `PKR ${p.pricePkr.toLocaleString()}` : "—",
        vehicle: p.vehicle,
        stays: p.stays ?? [],
        note: p.note,
      })),
      paymentTerms: itin.paymentTerms ?? [],
      bankDetails: itin.bankDetails,
      termsBlocks: itin.termsBlocks ?? [],
    };
  }, [adminSettings, itin, publicSettings, urlCursor]);

  useEffect(() => {
    if (!canQuery) return;
    if (!itin) return;
    if (!pdfModel) return;
    if (didRun.current) return;
    didRun.current = true;
    setBusy(true);
    setMsg(null);
    void (async () => {
      try {
        const blob = await pdf(<ItineraryPdf model={pdfModel} />).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(itin.title || "itinerary").replace(/\s+/g, "-").toLowerCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
        setMsg("Download started.");
      } catch (e) {
        setMsg(toUserFacingErrorMessage(e));
      } finally {
        setBusy(false);
      }
    })();
  }, [canQuery, itin, pdfModel]);

  if (!canQuery) {
    return (
      <p className="text-sm text-muted">
        {sessionToken === undefined ? "Loading session…" : "Sign in required."}
      </p>
    );
  }

  if (itin === undefined) return <p className="text-sm text-muted">Loading itinerary…</p>;
  if (!itin) return <p className="text-sm text-muted">Itinerary not found.</p>;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold text-foreground">Downloading PDF…</h1>
      <p className="text-sm text-muted">
        {busy ? "Preparing file…" : "If your download didn’t start, use the link below."}
      </p>
      {msg ? (
        <div className="rounded-xl border border-border bg-panel-elevated p-3 text-sm">{msg}</div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/admin/itineraries/${itin._id}`}
          className="inline-flex items-center justify-center rounded-xl border border-border bg-panel px-4 py-2 text-sm font-semibold text-foreground hover:bg-panel-elevated"
        >
          Back to itinerary
        </Link>
        <Link
          href="/admin/itineraries"
          className="inline-flex items-center justify-center rounded-xl border border-border bg-panel px-4 py-2 text-sm font-semibold text-foreground hover:bg-panel-elevated"
        >
          Back to list
        </Link>
      </div>
    </div>
  );
}

