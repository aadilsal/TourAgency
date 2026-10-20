import { expect, test } from "vitest";
import { api } from "../_generated/api.js";
import { newTest, signIn } from "./helpers.test-utils.js";
import { fillBlankDays } from "../../src/components/admin/itinerary/itineraryModel";

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

async function insertTour(t: ReturnType<typeof newTest>, over: Record<string, unknown> = {}) {
  return await t.run(async (ctx) =>
    ctx.db.insert("tours", {
      title: "Hunza Valley Classic",
      slug: `hunza-${Math.random().toString(36).slice(2)}`,
      description: "Classic Hunza trip",
      durationDays: 4,
      location: "Hunza",
      images: [],
      itinerary: [
        { day: 1, title: "Islamabad to Chilas", description: "Drive along the KKH" },
        { day: 2, title: "Chilas to Hunza", description: "Raikot bridge, Rakaposhi view" },
        { day: 3, title: "Attabad & Passu", description: "Boating and Passu cones" },
        { day: 4, title: "Back to Islamabad", description: "Return drive" },
      ],
      included: ["Prado with driver", "Hotels"],
      excluded: ["Lunch"],
      pricePkr: 180000,
      isActive: true,
      createdAt: Date.now(),
      ...over,
    }),
  );
}

/** What the builder sends for a fresh form: blank days, one blank tier, empty lists. */
const blankBuilderContent = {
  atGlanceDays: [1, 2].map((n) => ({ dayNumber: n, title: "", detail: "" })),
  packageTiers: [
    {
      name: "Standard",
      stays: [{ location: "Stop 1", hotel: "", nights: 1 }],
      hotels: [{ hotel: "", nights: 1 }],
    },
  ],
  included: [],
  notIncluded: [],
};

test("createDraft from a tour copies its day plan, lists, price and end date into blank fields", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const sourceTourId = await insertTour(t);
  const itineraryId = await draft(t, sessionToken, {
    days: 2,
    sourceTourId,
    startDate: "2026-11-01",
    clientPhone: " 0300 1234567 ",
    adults: 2,
    children: 1,
    ...blankBuilderContent,
  });
  const row = await t.query(api.itineraries.getForAdmin, { sessionToken, itineraryId });
  expect(row?.days).toBe(4);
  expect(row?.atGlanceDays?.map((d) => d.title)).toEqual([
    "Islamabad to Chilas",
    "Chilas to Hunza",
    "Attabad & Passu",
    "Back to Islamabad",
  ]);
  expect(row?.atGlanceDays?.[1]?.detail).toBe("Raikot bridge, Rakaposhi view");
  expect(row?.included).toEqual(["Prado with driver", "Hotels"]);
  expect(row?.notIncluded).toEqual(["Lunch"]);
  expect(row?.packageTiers?.[0]?.pricePkr).toBe(180000);
  expect(row?.packageTiers?.[0]?.name).toBe("Standard");
  expect(row?.startDate).toBe("2026-11-01");
  expect(row?.endDate).toBe("2026-11-04");
  expect(row?.clientPhone).toBe("0300 1234567");
  expect(row?.adults).toBe(2);
  expect(row?.children).toBe(1);
});

test("createDraft from a tour never overwrites content the admin passed", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const sourceTourId = await insertTour(t);
  const itineraryId = await draft(t, sessionToken, {
    days: 2,
    sourceTourId,
    startDate: "2026-11-01",
    endDate: "2026-11-02",
    atGlanceDays: [
      { dayNumber: 1, title: "My own day 1", detail: "" },
      { dayNumber: 2, title: "", detail: "" },
    ],
    packageTiers: [
      {
        name: "Deluxe",
        pricePkr: 99000,
        stays: [{ location: "Hunza", hotel: "Serena", nights: 1 }],
        hotels: [{ hotel: "Serena", nights: 1 }],
      },
    ],
    included: ["Jeep only"],
    notIncluded: ["Everything else"],
  });
  const row = await t.query(api.itineraries.getForAdmin, { sessionToken, itineraryId });
  expect(row?.days).toBe(2);
  expect(row?.atGlanceDays?.map((d) => d.title)).toEqual(["My own day 1", ""]);
  expect(row?.packageTiers?.[0]?.pricePkr).toBe(99000);
  expect(row?.packageTiers?.[0]?.name).toBe("Deluxe");
  expect(row?.included).toEqual(["Jeep only"]);
  expect(row?.notIncluded).toEqual(["Everything else"]);
  expect(row?.endDate).toBe("2026-11-02");
});

test("createDraft without a tour keeps blank content blank", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  await insertTour(t);
  const itineraryId = await draft(t, sessionToken, { days: 2, ...blankBuilderContent });
  const row = await t.query(api.itineraries.getForAdmin, { sessionToken, itineraryId });
  expect(row?.days).toBe(2);
  expect(row?.atGlanceDays?.every((d) => !d.title)).toBe(true);
  expect(row?.packageTiers?.[0]?.pricePkr).toBeUndefined();
  expect(row?.included).toEqual([]);
});

test("a USD-only tour keeps its price visible as a package note", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const sourceTourId = await insertTour(t, { pricePkr: undefined, priceUsd: 1200 });
  const itineraryId = await draft(t, sessionToken, { sourceTourId, ...blankBuilderContent });
  const row = await t.query(api.itineraries.getForAdmin, { sessionToken, itineraryId });
  expect(row?.packageTiers?.[0]?.pricePkr).toBeUndefined();
  expect(row?.packageTiers?.[0]?.note).toBe("Price: USD 1,200");
});

test("patchDraft: client contact null clears, undefined leaves it", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const itineraryId = await draft(t, sessionToken, {
    clientPhone: "0300 1111111",
    clientEmail: "a@b.co",
    adults: 3,
  });
  await t.mutation(api.itineraries.patchDraft, { sessionToken, itineraryId, title: "Renamed" });
  let row = await t.query(api.itineraries.getForAdmin, { sessionToken, itineraryId });
  expect(row?.clientPhone).toBe("0300 1111111");
  expect(row?.clientEmail).toBe("a@b.co");
  expect(row?.adults).toBe(3);

  await t.mutation(api.itineraries.patchDraft, {
    sessionToken,
    itineraryId,
    clientPhone: null,
    adults: null,
  });
  row = await t.query(api.itineraries.getForAdmin, { sessionToken, itineraryId });
  expect(row?.clientPhone).toBeUndefined();
  expect(row?.adults).toBeUndefined();
  expect(row?.clientEmail).toBe("a@b.co");
});

test("fillBlankDays (AI / tour drafts) never overwrites a day that has content", () => {
  const current = [
    { dayNumber: 1, title: "Admin title", detail: "" },
    { dayNumber: 2, title: "", detail: "Admin detail" },
    { dayNumber: 3, title: "", detail: "", overnight: "Hunza" },
    { dayNumber: 4, title: "", detail: "" },
    { dayNumber: 5, title: "  ", detail: "" },
  ];
  const drafted = [1, 2, 3, 4, 5].map((n) => ({
    dayNumber: n,
    title: `AI ${n}`,
    detail: `AI detail ${n}`,
    overnight: "Skardu",
  }));
  const { days, filled } = fillBlankDays(current, drafted);
  expect(days[0]).toEqual(current[0]);
  expect(days[1]).toEqual(current[1]);
  // Only an overnight town: the text is filled, the admin's town is kept.
  expect(days[2]).toEqual({ dayNumber: 3, title: "AI 3", detail: "AI detail 3", overnight: "Hunza" });
  expect(days[3]).toEqual({ dayNumber: 4, title: "AI 4", detail: "AI detail 4", overnight: "Skardu" });
  expect(days[4]?.title).toBe("AI 5");
  expect(filled).toBe(3);
  // Empty drafts change nothing.
  expect(fillBlankDays(current, [{ dayNumber: 4, title: " ", detail: "" }]).filled).toBe(0);
});
