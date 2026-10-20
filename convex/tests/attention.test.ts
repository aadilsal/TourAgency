import { expect, test } from "vitest";
import { api } from "../_generated/api.js";
import type { Id } from "../_generated/dataModel.js";
import { newTest, signIn } from "./helpers.test-utils.js";

type T = ReturnType<typeof newTest>;

async function insertTour(t: T, title = "Skardu Escape") {
  return (await t.run(async (ctx) =>
    ctx.db.insert("tours", {
      title,
      slug: title.toLowerCase().replace(/\s+/g, "-"),
      description: "d",
      durationDays: 3,
      location: "Skardu",
      images: [],
      itinerary: [],
      isActive: true,
      price: 100000,
      createdAt: Date.now(),
    } as never),
  )) as Id<"tours">;
}

async function seedInboxes(t: T) {
  const tourId = await insertTour(t);
  const base = 1_700_000_000_000;
  await t.run(async (ctx) => {
    const guest = (status: "pending" | "confirmed", name: string, phone: string, at: number) =>
      ctx.db.insert("guestBookings", {
        name,
        phone,
        phoneNormalized: phone.replace(/\D/g, ""),
        email: `${name.toLowerCase()}@mail.test`,
        tourId,
        peopleCount: 2,
        status,
        tourTitle: "Skardu Escape",
        createdAt: at,
      });
    await guest("pending", "Ayesha", "0300 1234567", base + 10);
    await guest("confirmed", "Bilal", "0321 7654321", base + 20);

    await ctx.db.insert("leads", {
      name: "Legacy Lead",
      phone: "0333 1112222",
      source: "Manual",
      message: "Need a Hunza trip",
      createdAt: base + 30,
    });
    await ctx.db.insert("leads", {
      name: "Replied Lead",
      phone: "0333 9998888",
      source: "Manual",
      status: "contacted",
      createdAt: base + 40,
    });
    await ctx.db.insert("leads", {
      name: "Fresh Lead",
      phone: "fresh@mail.test",
      source: "AI",
      status: "new",
      createdAt: base + 50,
    });

    await ctx.db.insert("customItineraryRequests", {
      name: "Trip Pending",
      phone: "+92 345 0001111",
      summary: "Naran 4 days",
      proposal: "…",
      status: "pending",
      createdAt: base + 60,
    });
    await ctx.db.insert("customItineraryRequests", {
      name: "Trip Done",
      phone: "+92 345 0002222",
      summary: "Swat",
      proposal: "…",
      status: "approved",
      createdAt: base + 70,
    });

    await ctx.db.insert("visaInvitationRequests", {
      contactName: "Visa Pending",
      contactEmail: "visa@mail.test",
      contactPhone: "+44 7700 900123",
      contactPhoneNormalized: "447700900123",
      travelers: [],
      status: "pending",
      consentGiven: true,
      createdAt: base + 80,
    });
    await ctx.db.insert("visaInvitationRequests", {
      contactName: "Visa Sent",
      contactEmail: "sent@mail.test",
      contactPhone: "+44 7700 900999",
      contactPhoneNormalized: "447700900999",
      travelers: [],
      status: "processed",
      consentGiven: true,
      createdAt: base + 90,
    });

    await ctx.db.insert("tourReviews", {
      tourId,
      authorName: "Reviewer Pending",
      rating: 5,
      body: "Great",
      status: "pending",
      createdAt: base + 100,
    });
    await ctx.db.insert("tourReviews", {
      tourId,
      authorName: "Reviewer Approved",
      rating: 4,
      body: "Good",
      status: "approved",
      createdAt: base + 110,
    });

    await ctx.db.insert("invoices", {
      clientName: "Ayesha Khan",
      invoiceNumber: "INV/26-27/0001",
      invoiceDate: "2026-10-01",
      currency: "PKR",
      status: "draft",
      items: [],
      discount: 0,
      tax: 0,
      paymentMethod: "bank",
      paymentDetails: "",
      createdAt: base + 120,
      updatedAt: base + 120,
    });
  });
  return { tourId };
}

test("attention inbox lists only new / pending items, newest first", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  await seedInboxes(t);

  const { items, counts } = await t.query(api.dashboard.getAttentionInbox, { sessionToken });
  expect(items.map((i) => i.name)).toEqual([
    "Reviewer Pending",
    "Visa Pending",
    "Trip Pending",
    "Fresh Lead",
    "Legacy Lead",
    "Ayesha",
  ]);
  expect(items.map((i) => i.kind)).toEqual(["review", "visa", "trip", "lead", "lead", "booking"]);
  // Email stored in the lead's phone column is moved to `email`.
  const fresh = items.find((i) => i.name === "Fresh Lead");
  expect(fresh?.email).toBe("fresh@mail.test");
  expect(fresh?.phone).toBeUndefined();
  expect(items.find((i) => i.kind === "booking")?.summary).toContain("Skardu Escape");

  expect(counts).toMatchObject({ bookings: 1, leads: 2, trips: 1, visa: 1, reviews: 1, total: 6 });

  const badge = await t.query(api.dashboard.getInboxCounts, { sessionToken });
  expect(badge).toEqual(counts);
});

test("attention inbox is bounded by limit and counts are capped", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  await t.run(async (ctx) => {
    for (let i = 0; i < 120; i++) {
      await ctx.db.insert("leads", {
        name: `Lead ${i}`,
        phone: `0300${String(i).padStart(7, "0")}`,
        source: "Manual",
        createdAt: 1_700_000_000_000 + i,
      });
    }
  });
  const { items, counts } = await t.query(api.dashboard.getAttentionInbox, {
    sessionToken,
    limit: 5,
  });
  expect(items).toHaveLength(5);
  expect(items[0].name).toBe("Lead 119");
  expect(counts.leads).toBe(counts.cap);
});

test("dashboard snapshot 'recent leads' only shows new leads", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  await seedInboxes(t);
  const snap = await t.query(api.dashboard.getAdminDashboardSnapshot, { sessionToken });
  expect(snap.recent.leads.map((l) => l.name)).toEqual(["Fresh Lead", "Legacy Lead"]);
  expect(snap.kpis.pendingReviews).toBe(1);
});

test("customer search finds by phone digits, name and email across inboxes", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  await seedInboxes(t);

  // Local format, international format and bare digits all match.
  for (const term of ["0300 1234567", "+92 300 1234567", "3001234"]) {
    const r = await t.query(api.admin.searchCustomers, { sessionToken, term });
    expect(r.map((x) => x.name)).toContain("Ayesha");
  }

  const byName = await t.query(api.admin.searchCustomers, { sessionToken, term: "ayes" });
  expect(byName.map((x) => x.kind).sort()).toEqual(["booking", "invoice"]);
  expect(byName.find((x) => x.kind === "invoice")?.href).toMatch(/^\/admin\/invoices\//);

  const byEmail = await t.query(api.admin.searchCustomers, {
    sessionToken,
    term: "VISA@mail.test",
  });
  expect(byEmail).toHaveLength(1);
  expect(byEmail[0]).toMatchObject({ kind: "visa", name: "Visa Pending" });

  const lead = await t.query(api.admin.searchCustomers, { sessionToken, term: "fresh@" });
  expect(lead[0]).toMatchObject({ kind: "lead", email: "fresh@mail.test" });

  // Too short / no match → empty.
  expect(await t.query(api.admin.searchCustomers, { sessionToken, term: "a" })).toEqual([]);
  expect(
    await t.query(api.admin.searchCustomers, { sessionToken, term: "nobody-here" }),
  ).toEqual([]);
});

test("attention, counts and search throw for non-admins and bad sessions", async () => {
  const t = newTest();
  const customer = await signIn(t, "customer");
  await expect(
    t.query(api.dashboard.getAttentionInbox, { sessionToken: customer }),
  ).rejects.toThrow(/admin access required/i);
  await expect(
    t.query(api.dashboard.getInboxCounts, { sessionToken: customer }),
  ).rejects.toThrow(/admin access required/i);
  await expect(
    t.query(api.admin.searchCustomers, { sessionToken: customer, term: "ali" }),
  ).rejects.toThrow(/admin access required/i);
  await expect(
    t.query(api.admin.searchCustomers, { sessionToken: "nope", term: "ali" }),
  ).rejects.toThrow(/not authenticated/i);
});

test("leads inbox filters by status; 'new' includes legacy leads", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  await seedInboxes(t);
  const page = (status?: "new" | "contacted") =>
    t.query(api.leads.listLeadsPage, {
      sessionToken,
      status,
      paginationOpts: { numItems: 10, cursor: null },
    });
  expect((await page("new")).page.map((l) => l.name)).toEqual(["Fresh Lead", "Legacy Lead"]);
  expect((await page("contacted")).page.map((l) => l.name)).toEqual(["Replied Lead"]);
  expect((await page()).page).toHaveLength(3);
});
