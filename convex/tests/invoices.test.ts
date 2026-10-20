import { expect, test } from "vitest";
import { api } from "../_generated/api.js";
import { newTest, signIn } from "./helpers.test-utils.js";

async function newInvoice(t: ReturnType<typeof newTest>, sessionToken: string, clientName = "Sara Malik") {
  return await t.mutation(api.invoices.createDraft, {
    sessionToken,
    clientName,
    invoiceDate: "2026-09-16",
    currency: "PKR",
  });
}

test("merged autosave patch persists every field at once", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const invoiceId = await newInvoice(t, sessionToken);

  // useAutosave merges edits to several fields into one patch.
  await t.mutation(api.invoices.patchDraft, {
    sessionToken,
    invoiceId,
    clientName: "Sara Malik ",
    items: [
      { name: "Trip package", description: "Hunza 5D", quantity: 2, price: 90000 },
      { name: "Jeep", quantity: 1, price: 15000 },
    ],
    discount: 5,
    tripSummary: "Hunza, Oct 2026",
  });
  // A later single-field edit must not wipe the earlier fields.
  await t.mutation(api.invoices.patchDraft, { sessionToken, invoiceId, tax: 2 });

  const inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
  expect(inv?.clientName).toBe("Sara Malik");
  expect(inv?.items).toHaveLength(2);
  expect(inv?.items[1]?.name).toBe("Jeep");
  expect(inv?.discount).toBe(5);
  expect(inv?.tax).toBe(2);
  expect(inv?.tripSummary).toBe("Hunza, Oct 2026");
});

test("patchDraft: itineraryId null unlinks, undefined leaves it", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const itineraryId = await t.mutation(api.itineraries.createDraft, {
    sessionToken,
    title: "Trip",
    clientName: "Sara",
    days: 2,
    theme: "minimal",
  });
  const invoiceId = await t.mutation(api.invoices.createFromItinerary, { sessionToken, itineraryId });

  await t.mutation(api.invoices.patchDraft, { sessionToken, invoiceId, discount: 1 });
  let inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
  expect(inv?.itineraryId).toBe(itineraryId);

  await t.mutation(api.invoices.patchDraft, { sessionToken, invoiceId, itineraryId: null });
  inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
  expect(inv?.itineraryId).toBeUndefined();
});

test("createFromItinerary keeps the advance amount it is given", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const itineraryId = await t.mutation(api.itineraries.createDraft, {
    sessionToken,
    title: "Trip",
    clientName: "Sara",
    days: 2,
    theme: "minimal",
  });
  const invoiceId = await t.mutation(api.invoices.createFromItinerary, {
    sessionToken,
    itineraryId,
    advanceAmount: 25000,
  });
  const inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
  expect(inv?.advanceAmount).toBe(25000);
});

test("searchForAdmin finds invoices beyond the first page by client or number", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const target = await newInvoice(t, sessionToken, "Zainab Qureshi");
  for (let i = 0; i < 55; i++) {
    await newInvoice(t, sessionToken, `Filler ${i}`);
  }

  const firstPage = await t.query(api.invoices.listForAdmin, {
    sessionToken,
    paginationOpts: { numItems: 50, cursor: null },
  });
  expect(firstPage.page.some((r) => r._id === target)).toBe(false);
  expect(firstPage.page[0]?.invoiceNumber).toMatch(/^INV\//);

  const byClient = await t.query(api.invoices.searchForAdmin, { sessionToken, search: "Zainab" });
  expect(byClient.map((r) => r._id)).toContain(target);

  const targetDoc = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId: target });
  const byNumber = await t.query(api.invoices.searchForAdmin, {
    sessionToken,
    search: targetDoc!.invoiceNumber!.toLowerCase(),
  });
  expect(byNumber[0]?._id).toBe(target);
});

async function pricedItinerary(t: ReturnType<typeof newTest>, sessionToken: string) {
  return await t.mutation(api.itineraries.createDraft, {
    sessionToken,
    title: "Hunza Escape",
    clientName: "Sara Malik",
    clientPhone: "0300 7654321",
    clientEmail: "sara@example.com",
    adults: 2,
    days: 5,
    startDate: "2026-11-01",
    endDate: "2026-11-05",
    theme: "minimal",
    packageTiers: [
      {
        name: "Standard",
        pricePkr: 150000,
        vehicle: "Prado",
        stays: [{ location: "Hunza", hotel: "Eagle's Nest", nights: 4 }],
        hotels: [{ hotel: "Eagle's Nest", nights: 4 }],
      },
      {
        name: "Deluxe",
        pricePkr: 250000,
        stays: [{ location: "Hunza", hotel: "Serena", nights: 4 }],
        hotels: [{ hotel: "Serena", nights: 4 }],
      },
    ],
  });
}

test("createFromItinerary imports the package price and copies the client contact", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const itineraryId = await pricedItinerary(t, sessionToken);
  const invoiceId = await t.mutation(api.invoices.createFromItinerary, { sessionToken, itineraryId });
  const inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
  // Packages are alternatives: only the first priced one becomes the line item.
  expect(inv?.items).toHaveLength(1);
  expect(inv?.items[0]?.price).toBe(150000);
  expect(inv?.items[0]?.quantity).toBe(1);
  expect(inv?.items[0]?.name).toBe("Hunza Escape (Standard)");
  expect(inv?.items[0]?.description).toContain("Eagle's Nest (4N)");
  expect(inv?.clientPhone).toBe("0300 7654321");
  expect(inv?.clientEmail).toBe("sara@example.com");
  expect(inv?.tripSummary).toContain("Hunza Escape");
  expect(inv?.tripSummary).toContain("2 adults");
  // Default terms come from the itinerary template's terms blocks.
  expect(inv?.terms).toContain("ID Requirements");
});

test("createFromItinerary without packages still creates one blank line", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const itineraryId = await t.mutation(api.itineraries.createDraft, {
    sessionToken,
    title: "Trip",
    clientName: "Sara",
    days: 2,
    theme: "minimal",
  });
  const invoiceId = await t.mutation(api.invoices.createFromItinerary, { sessionToken, itineraryId });
  const inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
  expect(inv?.items).toEqual([
    { name: "Trip package (2 days)", description: "Trip", quantity: 1, price: 0 },
  ]);
  expect(inv?.clientPhone).toBeUndefined();
});

test("invoice text defaults use the saved invoice text, and are insert-only", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  await t.mutation(api.siteSettings.upsertAdminSiteSettings, {
    sessionToken,
    invoiceTerms: "50% advance confirms the booking.",
    invoiceCancellationPolicy: "No refund within 7 days.",
  });
  const invoiceId = await t.mutation(api.invoices.createDraft, {
    sessionToken,
    clientName: "Ali",
    invoiceDate: "2026-09-16",
    currency: "PKR",
  });
  let inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
  expect(inv?.terms).toBe("50% advance confirms the booking.");
  expect(inv?.cancellationPolicy).toBe("No refund within 7 days.");

  // Text the wizard sends (what the admin saw / typed) wins over the defaults.
  const custom = await t.mutation(api.invoices.createDraft, {
    sessionToken,
    clientName: "Ali",
    invoiceDate: "2026-09-16",
    currency: "PKR",
    terms: "",
    cancellationPolicy: "Custom",
  });
  inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId: custom });
  expect(inv?.terms).toBe("");
  expect(inv?.cancellationPolicy).toBe("Custom");

  // Changing the defaults later never rewrites an existing invoice.
  await t.mutation(api.siteSettings.upsertAdminSiteSettings, { sessionToken, invoiceTerms: "Changed" });
  inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
  expect(inv?.terms).toBe("50% advance confirms the booking.");
});

test("getOrCreateForItinerary opens the linked invoice instead of making a second one", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const itineraryId = await pricedItinerary(t, sessionToken);
  const first = await t.mutation(api.invoices.getOrCreateForItinerary, { sessionToken, itineraryId });
  expect(first.created).toBe(true);
  await t.mutation(api.invoices.patchDraft, { sessionToken, invoiceId: first.invoiceId, discount: 5 });
  const second = await t.mutation(api.invoices.getOrCreateForItinerary, { sessionToken, itineraryId });
  expect(second).toEqual({ invoiceId: first.invoiceId, created: false });
  const inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId: first.invoiceId });
  expect(inv?.discount).toBe(5);
});

test("invoice status: advance paid is new; old draft/paid values keep working", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const invoiceId = await newInvoice(t, sessionToken);
  await t.mutation(api.invoices.setStatus, { sessionToken, invoiceId, status: "advance_paid" });
  let inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
  expect(inv?.status).toBe("advance_paid");
  await t.mutation(api.invoices.markPaid, { sessionToken, invoiceId });
  inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
  expect(inv?.status).toBe("paid");
  await t.mutation(api.invoices.markDraft, { sessionToken, invoiceId });
  inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
  expect(inv?.status).toBe("draft");
});

test("patchDraft: invoice client contact null clears, undefined leaves it", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const invoiceId = await t.mutation(api.invoices.createDraft, {
    sessionToken,
    clientName: "Ali",
    clientPhone: "0300 1",
    clientEmail: "ali@x.co",
    invoiceDate: "2026-09-16",
    currency: "PKR",
  });
  await t.mutation(api.invoices.patchDraft, { sessionToken, invoiceId, tax: 1 });
  let inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
  expect(inv?.clientPhone).toBe("0300 1");
  await t.mutation(api.invoices.patchDraft, { sessionToken, invoiceId, clientPhone: null });
  inv = await t.query(api.invoices.getForAdmin, { sessionToken, invoiceId });
  expect(inv?.clientPhone).toBeUndefined();
  expect(inv?.clientEmail).toBe("ali@x.co");
});
