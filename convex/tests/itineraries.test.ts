import { expect, test } from "vitest";
import { api } from "../_generated/api.js";
import { newTest, signIn } from "./helpers.test-utils.js";

async function draft(t: ReturnType<typeof newTest>, sessionToken: string, over: Record<string, unknown> = {}) {
  return await t.mutation(api.itineraries.createDraft, {
    sessionToken,
    title: "Hunza Escape",
    clientName: "Ayesha Khan",
    days: 3,
    theme: "luxury",
    ...over,
  });
}

test("createDraft saves content typed before the draft existed in the same transaction", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const itineraryId = await draft(t, sessionToken, {
    headline: "Your Dream Hunza Awaits —",
    pickupDropoff: "Pickup at Gilgit Airport",
    atGlanceDays: [
      { dayNumber: 1, title: "Arrive", detail: "Check in" },
      { dayNumber: 2, title: "Attabad", detail: "Boating" },
      { dayNumber: 3, title: "Depart", detail: "Fly home" },
    ],
    packageTiers: [
      {
        name: "Standard",
        pricePkr: 150000,
        stays: [{ location: "Hunza", hotel: "Eagle's Nest", nights: 2 }],
        hotels: [{ hotel: "Eagle's Nest", nights: 2 }],
      },
    ],
    included: ["Transport", " "],
    notIncluded: ["Flights"],
  });

  const row = await t.query(api.itineraries.getForAdmin, { sessionToken, itineraryId });
  expect(row?.headline).toBe("Your Dream Hunza Awaits —");
  expect(row?.pickupDropoff).toBe("Pickup at Gilgit Airport");
  expect(row?.atGlanceDays?.map((d) => d.title)).toEqual(["Arrive", "Attabad", "Depart"]);
  expect(row?.packageTiers?.[0]?.stays?.[0]?.hotel).toBe("Eagle's Nest");
  expect(row?.included).toEqual(["Transport"]);
  expect(row?.notIncluded).toEqual(["Flights"]);
  expect(row?.layoutVariant).toBe("simple");
});

test("createDraft without optional content keeps the old defaults (old frontend)", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const itineraryId = await draft(t, sessionToken);
  const row = await t.query(api.itineraries.getForAdmin, { sessionToken, itineraryId });
  expect(row?.headline).toBe("Your Dream Trip Awaits —");
  expect(row?.atGlanceDays).toHaveLength(3);
  expect(row?.included).toEqual([]);
});

test("patchDraft: null or blank clears dates, undefined leaves them unchanged", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const itineraryId = await draft(t, sessionToken, {
    startDate: "2026-10-01",
    endDate: "2026-10-03",
  });

  // Unrelated field patch must not touch dates.
  await t.mutation(api.itineraries.patchDraft, { sessionToken, itineraryId, title: "Renamed" });
  let row = await t.query(api.itineraries.getForAdmin, { sessionToken, itineraryId });
  expect(row?.startDate).toBe("2026-10-01");
  expect(row?.endDate).toBe("2026-10-03");

  await t.mutation(api.itineraries.patchDraft, {
    sessionToken,
    itineraryId,
    startDate: null,
    endDate: "",
  });
  row = await t.query(api.itineraries.getForAdmin, { sessionToken, itineraryId });
  expect(row?.startDate).toBeUndefined();
  expect(row?.endDate).toBeUndefined();
  expect(row?.title).toBe("Renamed");
});

test("patchDraft of one section never wipes another section", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const itineraryId = await draft(t, sessionToken, {
    included: ["Hotel"],
    atGlanceDays: [{ dayNumber: 1, title: "Arrive", detail: "Welcome dinner" }],
  });
  await t.mutation(api.itineraries.patchDraft, {
    sessionToken,
    itineraryId,
    notIncluded: ["Tips"],
  });
  const row = await t.query(api.itineraries.getForAdmin, { sessionToken, itineraryId });
  expect(row?.included).toEqual(["Hotel"]);
  expect(row?.notIncluded).toEqual(["Tips"]);
  expect(row?.atGlanceDays?.[0]?.detail).toBe("Welcome dinner");
});

test("searchForAdmin finds itineraries beyond the first page by title or client", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const target = await draft(t, sessionToken, { title: "Skardu Winter Special", clientName: "Bilal Ahmed" });
  for (let i = 0; i < 60; i++) {
    await draft(t, sessionToken, { title: `Filler trip ${i}`, clientName: `Guest ${i}` });
  }

  const firstPage = await t.query(api.itineraries.listForAdmin, {
    sessionToken,
    paginationOpts: { numItems: 50, cursor: null },
  });
  expect(firstPage.page.some((r) => r._id === target)).toBe(false);

  const byTitle = await t.query(api.itineraries.searchForAdmin, { sessionToken, search: "Skardu" });
  expect(byTitle.map((r) => r._id)).toContain(target);
  const byClient = await t.query(api.itineraries.searchForAdmin, { sessionToken, search: "Bilal" });
  expect(byClient.map((r) => r._id)).toContain(target);
  expect(await t.query(api.itineraries.searchForAdmin, { sessionToken, search: "  " })).toEqual([]);
});

test("searchForAdmin requires an admin session", async () => {
  const t = newTest();
  const sessionToken = await signIn(t, "customer");
  await expect(
    t.query(api.itineraries.searchForAdmin, { sessionToken, search: "x" }),
  ).rejects.toThrow();
});
