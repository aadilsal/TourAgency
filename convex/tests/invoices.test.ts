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
