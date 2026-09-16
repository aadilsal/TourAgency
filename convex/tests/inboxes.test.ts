import { expect, test } from "vitest";
import { api, internal } from "../_generated/api.js";
import type { Id } from "../_generated/dataModel.js";
import { newTest, signIn } from "./helpers.test-utils.js";

type T = ReturnType<typeof newTest>;

async function insertVisa(t: T, overrides: Record<string, unknown> = {}) {
  return (await t.run(async (ctx) =>
    ctx.db.insert("visaInvitationRequests", {
      contactName: "Ali",
      contactEmail: "ali@test.dev",
      contactPhone: "+923001112233",
      contactPhoneNormalized: "923001112233",
      travelers: [],
      status: "pending",
      consentGiven: true,
      createdAt: Date.now(),
      ...overrides,
    } as never),
  )) as Id<"visaInvitationRequests">;
}

async function insertPlan(t: T, overrides: Record<string, unknown> = {}) {
  return (await t.run(async (ctx) =>
    ctx.db.insert("customItineraryRequests", {
      name: "Sara",
      phone: "+923001112233",
      summary: "Hunza 5 days",
      proposal: "Day 1…",
      status: "pending",
      createdAt: Date.now(),
      ...overrides,
    } as never),
  )) as Id<"customItineraryRequests">;
}

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

test("changing visa status never deletes the admin note", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const requestId = await insertVisa(t, { adminNote: "Passport scan received" });

  await t.mutation(api.visaInvitations.setStatus, {
    sessionToken,
    requestId,
    status: "processed",
  });
  let row = await t.run((ctx) => ctx.db.get(requestId));
  expect(row?.status).toBe("processed");
  expect(row?.adminNote).toBe("Passport scan received");

  await t.mutation(api.visaInvitations.setAdminNote, {
    sessionToken,
    requestId,
    adminNote: "Letter sent",
  });
  row = await t.run((ctx) => ctx.db.get(requestId));
  expect(row?.adminNote).toBe("Letter sent");
  expect(row?.status).toBe("processed");

  // Explicit "" clears.
  await t.mutation(api.visaInvitations.setStatus, {
    sessionToken,
    requestId,
    status: "pending",
    adminNote: "",
  });
  row = await t.run((ctx) => ctx.db.get(requestId));
  expect(row?.adminNote).toBeUndefined();
});

test("visa inbox paginates newest first with indexed status filter", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  for (let i = 0; i < 5; i++) {
    await insertVisa(t, { status: i % 2 ? "processed" : "pending", createdAt: 1000 + i });
  }
  const page = await t.query(api.visaInvitations.listForAdminPage, {
    sessionToken,
    paginationOpts: { numItems: 2, cursor: null },
  });
  expect(page.page).toHaveLength(2);
  expect(page.isDone).toBe(false);
  expect(page.page[0].createdAt).toBeGreaterThan(page.page[1].createdAt);

  const pending = await t.query(api.visaInvitations.listForAdminPage, {
    sessionToken,
    status: "pending",
    paginationOpts: { numItems: 10, cursor: null },
  });
  expect(pending.page).toHaveLength(3);
  expect(pending.page.every((r) => r.status === "pending")).toBe(true);
});

test("approving a trip request without a note keeps the existing note", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const requestId = await insertPlan(t);

  // Notes can be saved while still pending.
  await t.mutation(api.customItineraries.setAdminNote, {
    sessionToken,
    requestId,
    adminNote: "Called client, wants a jeep",
  });
  await t.mutation(api.customItineraries.setRequestStatus, {
    sessionToken,
    requestId,
    status: "approved",
  });
  let row = await t.run((ctx) => ctx.db.get(requestId));
  expect(row?.status).toBe("approved");
  expect(row?.adminNote).toBe("Called client, wants a jeep");

  await t.mutation(api.customItineraries.setRequestStatus, {
    sessionToken,
    requestId,
    status: "rejected",
    adminNote: "Dates unavailable",
  });
  row = await t.run((ctx) => ctx.db.get(requestId));
  expect(row?.adminNote).toBe("Dates unavailable");
});

test("bookings: title snapshot, paginated list, status + note never clobber each other", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const tourId = await insertTour(t);

  const guestId = await t.mutation(api.bookings.createGuestBooking, {
    name: "Guest One",
    phone: "+923001234567",
    tourId,
    peopleCount: 2,
  });
  const guestDoc = await t.run((ctx) => ctx.db.get(guestId));
  expect(guestDoc?.tourTitle).toBe("Skardu Escape");

  await t.mutation(api.bookings.setBookingAdminNote, {
    sessionToken,
    kind: "guest",
    id: guestId,
    adminNote: "Prefers morning call",
  });
  await t.mutation(api.bookings.updateBookingStatus, {
    sessionToken,
    kind: "guest",
    id: guestId,
    status: "confirmed",
  });

  // Tour deleted later: the booking still shows its title.
  await t.run((ctx) => ctx.db.delete(tourId));

  const page = await t.query(api.bookings.listBookingsPage, {
    sessionToken,
    kind: "guest",
    status: "confirmed",
    paginationOpts: { numItems: 10, cursor: null },
  });
  expect(page.page).toHaveLength(1);
  expect(page.page[0].tourTitle).toBe("Skardu Escape");
  expect(page.page[0].tourDeleted).toBe(true);
  expect(page.page[0].adminNote).toBe("Prefers morning call");
  expect(page.page[0].status).toBe("confirmed");

  const pending = await t.query(api.bookings.listBookingsPage, {
    sessionToken,
    kind: "guest",
    status: "pending",
    paginationOpts: { numItems: 10, cursor: null },
  });
  expect(pending.page).toHaveLength(0);

  await expect(
    t.mutation(api.bookings.updateBookingStatus, {
      sessionToken,
      kind: "user",
      id: "not-an-id",
      status: "confirmed",
    }),
  ).rejects.toThrow(/not found/i);
});

test("leads: status and note patch independently", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const leadId = (await t.run((ctx) =>
    ctx.db.insert("leads", {
      name: "Lead",
      phone: "1",
      source: "Manual",
      createdAt: Date.now(),
    }),
  )) as Id<"leads">;

  await t.mutation(api.leads.updateLead, { sessionToken, leadId, adminNote: "Call back Friday" });
  await t.mutation(api.leads.updateLead, { sessionToken, leadId, status: "contacted" });
  let lead = await t.run((ctx) => ctx.db.get(leadId));
  expect(lead?.status).toBe("contacted");
  expect(lead?.adminNote).toBe("Call back Friday");

  await t.mutation(api.leads.updateLead, { sessionToken, leadId, adminNote: "" });
  lead = await t.run((ctx) => ctx.db.get(leadId));
  expect(lead?.adminNote).toBeUndefined();
  expect(lead?.status).toBe("contacted");

  const page = await t.query(api.leads.listLeadsPage, {
    sessionToken,
    paginationOpts: { numItems: 10, cursor: null },
  });
  expect(page.page).toHaveLength(1);
});

test("inbox endpoints reject non-admins", async () => {
  const t = newTest();
  const customer = await signIn(t, "customer");
  const opts = { numItems: 5, cursor: null };
  await expect(
    t.query(api.bookings.listBookingsPage, { sessionToken: customer, kind: "guest", paginationOpts: opts }),
  ).rejects.toThrow();
  await expect(
    t.query(api.leads.listLeadsPage, { sessionToken: customer, paginationOpts: opts }),
  ).rejects.toThrow();
  await expect(
    t.query(api.customItineraries.listForAdminPage, { sessionToken: customer, paginationOpts: opts }),
  ).rejects.toThrow();
});

test("dashboard snapshot counts pending items via indexes", async () => {
  const t = newTest();
  const sessionToken = await signIn(t, "super_admin");
  const tourId = await insertTour(t);
  await t.mutation(api.bookings.createGuestBooking, {
    name: "G",
    phone: "+923001234567",
    tourId,
    peopleCount: 1,
  });
  await insertVisa(t);
  await insertPlan(t);
  const snap = await t.query(api.dashboard.getAdminDashboardSnapshot, {
    sessionToken,
    includeAdmins: true,
  });
  expect(snap.kpis.pendingBookings).toBe(1);
  expect(snap.kpis.pendingVisaInvitations).toBe(1);
  expect(snap.kpis.pendingCustomPlans).toBe(1);
  expect(snap.recent.pendingBookings[0].tourTitle).toBe("Skardu Escape");
  expect(snap.admins.length).toBeGreaterThanOrEqual(1);
});

test("tour USD backfill is internal, dry-run by default, and skips unpriced tours", async () => {
  const t = newTest();
  const paid = await insertTour(t, "Paid Tour");
  const free = await t.run(async (ctx) =>
    ctx.db.insert("tours", {
      title: "Free",
      slug: "free",
      description: "d",
      durationDays: 1,
      location: "L",
      images: [],
      itinerary: [],
      isActive: true,
      price: 0,
      createdAt: Date.now(),
    } as never),
  );

  const dry = await t.mutation(internal.migrations.backfillTourUsdPrices, {});
  expect(dry.dryRun).toBe(true);
  expect(dry.patched).toBe(0);
  expect((await t.run((ctx) => ctx.db.get(paid)))?.priceUsd).toBeUndefined();

  await t.mutation(internal.migrations.backfillTourUsdPrices, { dryRun: false });
  expect((await t.run((ctx) => ctx.db.get(paid)))?.priceUsd).toBeGreaterThan(1);
  expect((await t.run((ctx) => ctx.db.get(free as Id<"tours">)))?.priceUsd).toBeUndefined();
});
