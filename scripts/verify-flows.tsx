/**
 * End-to-end flow verification against the configured Convex deployment.
 *
 *   npm run verify:flows
 *
 * Exercises the three flows the business runs on — tours, itineraries and
 * invoices — through the same public API the browser uses, asserts the data
 * really landed in the database, renders the PDFs from what was stored, and
 * checks that admin endpoints reject unauthenticated callers. Everything it
 * creates is named "__verify…" and deleted again at the end.
 *
 * It mints a short-lived admin session through the CLI (the only privileged
 * step) and revokes it before exiting.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ConvexHttpClient } from "convex/browser";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { api } from "../convex/_generated/api.js";
import type { Id } from "../convex/_generated/dataModel.js";
import { ItineraryPdf, type ItineraryPdfModel } from "../src/documents/itinerary/ItineraryPdf";
import { InvoicePdf, type InvoicePdfModel } from "../src/documents/invoice/InvoicePdf";
import { alignHotelsToRows, tiersToPackagesForPdf } from "../src/lib/itineraryPackageMatrix";

// ── setup ────────────────────────────────────────────────────────────────────

function readEnvLocal(): Record<string, string> {
  const out: Record<string, string> = {};
  const file = path.resolve(".env.local");
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]!] = m[2]!.replace(/\s+#.*$/, "").trim();
  }
  return out;
}

const env = readEnvLocal();
const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? env.NEXT_PUBLIC_CONVEX_URL;
if (!deploymentUrl) {
  console.error("NEXT_PUBLIC_CONVEX_URL not found (checked env and .env.local)");
  process.exit(1);
}

/** Every record this harness creates starts with this, so it can find its own mess. */
const PREFIX = "__verify";

const results: Array<{ area: string; name: string; ok: boolean; detail?: string }> = [];
function check(area: string, name: string, ok: boolean, detail?: string) {
  results.push({ area, name, ok, detail });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${!ok && detail ? ` — ${detail}` : ""}`);
}

/** Runs the Convex CLI directly (no shell) so JSON args survive Windows quoting. */
function convexCli(fn: string, args: unknown): string {
  const cli = path.resolve("node_modules/convex/bin/main.js");
  return execFileSync(process.execPath, [cli, "run", fn, JSON.stringify(args)], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function main() {
  const admin = new ConvexHttpClient(deploymentUrl);
  const anon = new ConvexHttpClient(deploymentUrl);

  // Mint a 10-minute admin session for the highest-privilege existing user.
  const adminUsers = (await anon
    .query(api.auth.validateSession, { token: "___none___" })
    .catch(() => null)) as unknown;
  void adminUsers; // touch: proves an unauthenticated query path works at all

  const superAdminId = process.env.VERIFY_ADMIN_USER_ID ?? env.VERIFY_ADMIN_USER_ID;
  if (!superAdminId) {
    console.error(
      "Set VERIFY_ADMIN_USER_ID (a users._id with role super_admin) in .env.local to run this.",
    );
    process.exit(1);
  }

  const crypto = await import("node:crypto");
  const sessionToken = crypto.randomBytes(24).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
  convexCli("auth:createSession", {
    userId: superAdminId,
    tokenHash,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });
  console.log(`session minted for ${superAdminId}\n`);

  let tourId: Id<"tours"> | null = null;
  let itineraryId: Id<"itineraries"> | null = null;
  let invoiceId: Id<"invoices"> | null = null;

  // ── SWEEP ────────────────────────────────────────────────────────────────
  // Remove leftovers from a previous run that was interrupted before cleanup
  // (a killed process skips the finally block), so test rows never accumulate.
  {
    let swept = 0;
    const invoices = await admin.query(api.invoices.listForAdmin, {
      sessionToken,
      paginationOpts: { numItems: 200, cursor: null },
    });
    for (const i of invoices.page) {
      if (i.clientName?.startsWith(PREFIX)) {
        await admin.mutation(api.invoices.deleteInvoice, { sessionToken, invoiceId: i._id });
        swept++;
      }
    }
    const itins = await admin.query(api.itineraries.listForAdmin, {
      sessionToken,
      paginationOpts: { numItems: 200, cursor: null },
    });
    for (const i of itins.page) {
      if (i.title?.startsWith(PREFIX) || i.clientName?.startsWith(PREFIX)) {
        await admin.mutation(api.itineraries.deleteItinerary, {
          sessionToken,
          itineraryId: i._id,
        });
        swept++;
      }
    }
    const tours = (await admin.query(api.tours.getTours, {
      sessionToken,
      includeInactive: true,
    })) as Array<{ _id: Id<"tours">; title: string }>;
    for (const t of tours) {
      if (t.title?.startsWith(PREFIX)) {
        await admin.mutation(api.tours.deleteTour, { sessionToken, tourId: t._id });
        swept++;
      }
    }
    if (swept > 0) console.log(`swept ${swept} leftover test row(s) from an earlier run\n`);
  }

  try {
    // ── TOURS ───────────────────────────────────────────────────────────────
    console.log("TOURS");
    const slug = `__verify-tour-${Date.now()}`;
    tourId = (await admin.mutation(api.tours.createTour, {
      sessionToken,
      title: "__verify Hunza Explorer",
      slug,
      description: "Verification tour — safe to delete.",
      types: ["adventure"],
      durationDays: 5,
      location: "Hunza, Gilgit-Baltistan",
      pricePkr: 185000,
      images: [],
      itinerary: [
        { day: 1, title: "Islamabad to Chilas", description: "Drive along the Karakoram Highway." },
        { day: 2, title: "Chilas to Hunza", description: "Continue north to Karimabad." },
      ],
      included: ["Transport", "Hotel"],
      excluded: ["Air tickets"],
      isActive: true,
    })) as Id<"tours">;
    check("tours", "createTour returns an id", Boolean(tourId));

    const tour = await admin.query(api.tours.getTourForAdmin, { sessionToken, tourId });
    check("tours", "tour stored with title", tour?.title === "__verify Hunza Explorer");
    check("tours", "tour stored with 2 itinerary days", (tour?.itinerary ?? []).length === 2);
    check("tours", "tour stored with price", tour?.pricePkr === 185000);
    check("tours", "tour stored with inclusions", (tour?.included ?? []).length === 2);

    await admin.mutation(api.tours.updateTour, {
      sessionToken,
      tourId,
      title: "__verify Hunza Explorer (edited)",
      isActive: false,
    });
    const tour2 = await admin.query(api.tours.getTourForAdmin, { sessionToken, tourId });
    check("tours", "updateTour persisted title", tour2?.title === "__verify Hunza Explorer (edited)");
    check("tours", "updateTour persisted isActive=false", tour2?.isActive === false);
    check("tours", "update did not clobber itinerary", (tour2?.itinerary ?? []).length === 2);

    const allTours = (await admin.query(api.tours.getTours, {
      sessionToken,
      includeInactive: true,
    })) as Array<{ _id: string }>;
    check(
      "tours",
      "inactive tour visible in admin list",
      allTours.some((t) => t._id === tourId),
    );

    // ── ITINERARIES ─────────────────────────────────────────────────────────
    console.log("\nITINERARIES");
    itineraryId = (await admin.mutation(api.itineraries.createDraft, {
      sessionToken,
      title: "__verify 6 days Swat & Kalam",
      clientName: "__verify Client",
      startDate: "2026-09-01",
      endDate: "2026-09-06",
      days: 6,
      theme: "minimal",
    })) as Id<"itineraries">;
    check("itineraries", "createDraft returns an id", Boolean(itineraryId));

    const atGlanceDays = Array.from({ length: 6 }, (_, i) => ({
      dayNumber: i + 1,
      title: `Day ${i + 1} route label`,
      detail: `Day ${i + 1}: drive, sightseeing and meals as agreed.`,
      overnight: `Overnight town ${i + 1}`,
    }));
    await admin.mutation(api.itineraries.patchDraft, {
      sessionToken,
      itineraryId,
      pickupDropoff: "Pickup from Peshawar Airport & Drop off at Islamabad",
      atGlanceDays,
      included: ["Air conditioned vehicle", "Hotel accommodation", "Daily breakfast"],
      notIncluded: ["Lunch & dinner", "Air tickets"],
      packageTiers: [
        {
          name: "Standard",
          pricePkr: 420000,
          vehicle: "Toyota Grand Cabin",
          stays: [{ location: "Kalam", hotel: "Verify Inn", nights: 3 }],
          hotels: [{ hotel: "Verify Inn", nights: 3 }],
        },
      ],
    });

    const itin = await admin.query(api.itineraries.getForAdmin, { sessionToken, itineraryId });
    check("itineraries", "6 day rows stored", (itin?.atGlanceDays ?? []).length === 6);
    check(
      "itineraries",
      "every day has detail text",
      (itin?.atGlanceDays ?? []).every((d) => d.detail.trim().length > 0),
    );
    check("itineraries", "inclusions stored", (itin?.included ?? []).length === 3);
    check("itineraries", "exclusions stored", (itin?.notIncluded ?? []).length === 2);
    check("itineraries", "package tier price stored", itin?.packageTiers?.[0]?.pricePkr === 420000);
    check(
      "itineraries",
      "package hotel stored",
      itin?.packageTiers?.[0]?.stays?.[0]?.hotel === "Verify Inn",
    );

    // ── ITINERARY PDF (rendered from what the DB returned) ───────────────────
    console.log("\nITINERARY PDF");
    const rows = [{ location: "" }];
    const tiers = alignHotelsToRows(itin?.packageTiers ?? [], rows.length);
    const model: ItineraryPdfModel = {
      layoutVariant: "simple",
      includeEmptySections: true,
      headline: itin?.headline ?? "",
      variantLabel: itin?.variantLabel ?? "",
      tripTitle: itin?.title ?? "",
      clientName: itin?.clientName ?? "",
      dateRangeLabel: "01 Sep 2026 – 06 Sep 2026",
      nightsLabel: "5-Night",
      daysLabel: "6-Day",
      coverImageUrl: null,
      logoUrl: null,
      atGlanceDays: itin?.atGlanceDays ?? [],
      dayPlans: [],
      included: itin?.included ?? [],
      notIncluded: itin?.notIncluded ?? [],
      packages: tiersToPackagesForPdf(rows, tiers),
    };
    const itinPdf = await renderToBuffer(<ItineraryPdf model={model} />);
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default as (
      b: Buffer,
    ) => Promise<{ text: string; numpages: number }>;
    const itinText = (await pdfParse(itinPdf)).text.replace(/\s+/g, " ");
    check("itinerary pdf", "renders a non-trivial file", itinPdf.length > 5000, `${itinPdf.length} bytes`);
    check("itinerary pdf", "contains day 1 detail", itinText.includes("Day 1: drive, sightseeing"));
    check("itinerary pdf", "contains day 6 detail", itinText.includes("Day 6: drive, sightseeing"));
    check("itinerary pdf", "contains an inclusion", itinText.includes("Air conditioned vehicle"));
    check("itinerary pdf", "contains an exclusion", itinText.includes("Lunch & dinner"));
    check("itinerary pdf", "contains the package price", itinText.includes("420,000"));

    // ── INVOICES ────────────────────────────────────────────────────────────
    console.log("\nINVOICES");
    invoiceId = (await admin.mutation(api.invoices.createFromItinerary, {
      sessionToken,
      itineraryId,
      currency: "PKR",
    })) as Id<"invoices">;
    check("invoices", "createFromItinerary returns an id", Boolean(invoiceId));

    await admin.mutation(api.invoices.patchDraft, {
      sessionToken,
      invoiceId,
      items: [
        { name: "Trip package (6 days)", description: "Standard tier", quantity: 2, price: 210000 },
        { name: "Airport transfer", description: "", quantity: 1, price: 15000 },
      ],
      advanceAmount: 100000,
      tripSummary: "__verify 6 days Swat & Kalam",
    });
    const inv = await admin.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
    check("invoices", "invoice number issued", Boolean(inv?.invoiceNumber));
    check("invoices", "client copied from itinerary", (inv?.clientName ?? "").includes("__verify"));
    check("invoices", "line items stored", (inv?.items ?? []).length === 2);
    check("invoices", "item price stored", inv?.items?.[0]?.price === 210000);
    check("invoices", "advance stored", inv?.advanceAmount === 100000);
    check("invoices", "linked to itinerary", inv?.itineraryId === itineraryId);

    await admin.mutation(api.invoices.markPaid, { sessionToken, invoiceId });
    const invPaid = await admin.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
    check("invoices", "markPaid persisted", invPaid?.status === "paid");

    // ── INVOICE PDF ─────────────────────────────────────────────────────────
    console.log("\nINVOICE PDF");
    const invModel: InvoicePdfModel = {
      invoiceNumberLabel: inv?.invoiceNumber,
      invoiceDateLabel: inv?.invoiceDate ?? "",
      currency: (inv?.currency ?? "PKR") as "PKR" | "USD",
      companyName: "JunketTours",
      companyLogoUrl: null,
      client: { name: inv?.clientName ?? "" },
      items: (inv?.items ?? []).map((i) => ({
        name: i.name,
        description: i.description,
        quantity: i.quantity,
        price: i.price,
      })),
      discount: inv?.discount ?? 0,
      tax: inv?.tax ?? 0,
      advanceAmount: inv?.advanceAmount ?? 0,
      isFinal: true,
      payment: { method: "bank", details: "" },
    };
    const invPdf = await renderToBuffer(<InvoicePdf model={invModel} />);
    const invText = (await pdfParse(invPdf)).text.replace(/\s+/g, " ");
    check("invoice pdf", "renders a non-trivial file", invPdf.length > 3000, `${invPdf.length} bytes`);
    check("invoice pdf", "contains the invoice number", invText.includes(inv?.invoiceNumber ?? "###"));
    check("invoice pdf", "contains the client name", invText.includes("__verify"));
    check("invoice pdf", "contains a line item", invText.includes("Trip package (6 days)"));
    check("invoice pdf", "contains a line total", invText.includes("420,000") || invText.includes("210,000"));

    // ── SECURITY: admin endpoints must reject anonymous callers ─────────────
    console.log("\nSECURITY (anonymous caller must be rejected)");
    const FORGED = "forged-token-not-in-the-sessions-table";
    /**
     * An endpoint is safe only if it refuses BOTH a caller with no token at all
     * (validator rejection) and a caller presenting a token that isn't a real
     * session (auth rejection).
     */
    const rejects = async (
      label: string,
      noToken: () => Promise<unknown>,
      forgedToken: () => Promise<unknown>,
    ) => {
      const outcome = async (run: () => Promise<unknown>, kind: string) => {
        try {
          await run();
          return `SUCCEEDED with ${kind}`;
        } catch (e) {
          const m = (e as Error).message ?? "";
          if (/missing the required field 'sessionToken'|ArgumentValidationError/i.test(m)) return null;
          if (/not authenticated|admin access required|super admin access required/i.test(m)) return null;
          return `unexpected error with ${kind}: ${m.slice(0, 70)}`;
        }
      };
      const a = await outcome(noToken, "no token");
      const b = await outcome(forgedToken, "forged token");
      const problem = a ?? b;
      check("security", label, !problem, problem ?? undefined);
    };

    await rejects(
      "analytics.getAnalyticsSnapshot",
      () => anon.query(api.analytics.getAnalyticsSnapshot, {} as never),
      () => anon.query(api.analytics.getAnalyticsSnapshot, { sessionToken: FORGED }),
    );
    await rejects(
      "admin.getUsers",
      () => anon.query(api.admin.getUsers, {} as never),
      () => anon.query(api.admin.getUsers, { sessionToken: FORGED }),
    );
    await rejects(
      "bookings.getAllBookings",
      () => anon.query(api.bookings.getAllBookings, {} as never),
      () => anon.query(api.bookings.getAllBookings, { sessionToken: FORGED }),
    );
    await rejects(
      "leads.getLeads",
      () => anon.query(api.leads.getLeads, {} as never),
      () => anon.query(api.leads.getLeads, { sessionToken: FORGED }),
    );
    await rejects(
      "destinations.listForAdmin",
      () => anon.query(api.destinations.listForAdmin, {} as never),
      () => anon.query(api.destinations.listForAdmin, { sessionToken: FORGED }),
    );
    await rejects(
      "itineraries.listForAdmin",
      () => anon.query(api.itineraries.listForAdmin, {} as never),
      () =>
        anon.query(api.itineraries.listForAdmin, {
          sessionToken: FORGED,
          paginationOpts: { numItems: 5, cursor: null },
        }),
    );
    await rejects(
      "invoices.listForAdmin",
      () => anon.query(api.invoices.listForAdmin, {} as never),
      () =>
        anon.query(api.invoices.listForAdmin, {
          sessionToken: FORGED,
          paginationOpts: { numItems: 5, cursor: null },
        }),
    );
    await rejects(
      "tours.deleteTour",
      () => anon.mutation(api.tours.deleteTour, { tourId } as never),
      () => anon.mutation(api.tours.deleteTour, { sessionToken: FORGED, tourId: tourId! }),
    );
    await rejects(
      "seed.seedSampleTours",
      () => anon.mutation(api.seed.seedSampleTours, {} as never),
      () => anon.mutation(api.seed.seedSampleTours, { sessionToken: FORGED }),
    );
    await rejects(
      "migrations.backfillTourUsdPrices",
      () => anon.mutation(api.migrations.backfillTourUsdPrices, {} as never),
      () => anon.mutation(api.migrations.backfillTourUsdPrices, { sessionToken: FORGED }),
    );
    await rejects(
      "admin.promoteUser (super-admin only)",
      () => anon.mutation(api.admin.promoteUser, { userId: superAdminId } as never),
      () =>
        anon.mutation(api.admin.promoteUser, {
          sessionToken: FORGED,
          userId: superAdminId as Id<"users">,
        }),
    );
  } finally {
    // ── CLEANUP ─────────────────────────────────────────────────────────────
    console.log("\nCLEANUP");
    if (invoiceId) {
      await admin
        .mutation(api.invoices.deleteInvoice, { sessionToken, invoiceId })
        .then(() => check("cleanup", "test invoice deleted", true))
        .catch((e) => check("cleanup", "test invoice deleted", false, (e as Error).message));
    }
    if (itineraryId) {
      await admin
        .mutation(api.itineraries.deleteItinerary, { sessionToken, itineraryId })
        .then(() => check("cleanup", "test itinerary deleted", true))
        .catch((e) => check("cleanup", "test itinerary deleted", false, (e as Error).message));
    }
    if (tourId) {
      await admin
        .mutation(api.tours.deleteTour, { sessionToken, tourId })
        .then(() => check("cleanup", "test tour deleted", true))
        .catch((e) => check("cleanup", "test tour deleted", false, (e as Error).message));
    }
    try {
      await admin.mutation(api.auth.revokeSessionByToken, { token: sessionToken });
      check("cleanup", "test session revoked", true);
    } catch (e) {
      check("cleanup", "test session revoked", false, (e as Error).message);
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log("\nFAILURES:");
    for (const f of failed) console.log(`  [${f.area}] ${f.name}${f.detail ? ` — ${f.detail}` : ""}`);
  }
  process.exit(failed.length ? 1 : 0);
}

void main().catch((e) => {
  console.error("\nharness crashed:", e);
  process.exit(1);
});
