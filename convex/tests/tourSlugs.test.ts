import { expect, test } from "vitest";
import { api, internal } from "../_generated/api.js";
import type { Id } from "../_generated/dataModel.js";
import { normalizeTourSlug } from "../lib/tourSlug.js";
import { newTest, signIn } from "./helpers.test-utils.js";

type T = ReturnType<typeof newTest>;

const BAD_SLUG = "6-day-trip-to-gandhara-civilization-&-buddhist-monasteries";
const CLEAN_SLUG = "6-day-trip-to-gandhara-civilization-and-buddhist-monasteries";

const baseTour = {
  title: "Gandhara",
  description: "Buddhist sites.",
  durationDays: 6,
  location: "KPK",
  images: ["https://img.example/a.jpg"],
  itinerary: [{ day: 1, title: "Taxila", description: "Museum" }],
  isActive: true,
};

/** Inserts a tour directly, the way rows saved under the old slug rule look. */
async function insertRawTour(t: T, slug: string) {
  return await t.run((ctx) =>
    ctx.db.insert("tours", {
      ...baseTour,
      slug,
      types: ["culture"],
      price: 1000,
      pricePkr: 1000,
      priceUsd: 1480,
      imageFolderKey: `tours/${slug}`,
      createdAt: 1,
      updatedAt: 5,
    }),
  );
}

test("normalizeTourSlug keeps clean slugs unchanged and cleans unsafe ones", () => {
  expect(normalizeTourSlug("hunza-explorer")).toBe("hunza-explorer");
  expect(normalizeTourSlug(BAD_SLUG)).toBe(CLEAN_SLUG);
  expect(normalizeTourSlug("  Hunza's Café Tour!  ")).toBe("hunzas-cafe-tour");
  expect(normalizeTourSlug("a--b__c")).toBe("a-b-c");
});

test("createTour stores a URL-safe slug", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const tourId = (await t.mutation(api.tours.createTour, {
    sessionToken,
    ...baseTour,
    slug: BAD_SLUG,
  })) as Id<"tours">;
  const tour = await t.run((ctx) => ctx.db.get(tourId));
  expect(tour!.slug).toBe(CLEAN_SLUG);
});

test("migration renames only bad slugs, keeps every other field, and old links resolve", async () => {
  const t = newTest();
  const badId = await insertRawTour(t, BAD_SLUG);
  const goodId = await insertRawTour(t, "hunza-explorer");
  const before = await t.run(async (ctx) => ({
    bad: await ctx.db.get(badId),
    good: await ctx.db.get(goodId),
  }));

  const dry = await t.mutation(internal.migrations.normalizeTourSlugs, {});
  expect(dry.changes).toEqual([
    { tourId: badId, from: BAD_SLUG, to: CLEAN_SLUG, status: "would rename" },
  ]);
  expect((await t.run((ctx) => ctx.db.get(badId)))!.slug).toBe(BAD_SLUG);

  const run = await t.mutation(internal.migrations.normalizeTourSlugs, { dryRun: false });
  expect(run.changes[0]!.status).toBe("renamed");

  const after = await t.run(async (ctx) => ({
    bad: await ctx.db.get(badId),
    good: await ctx.db.get(goodId),
    count: (await ctx.db.query("tours").take(100)).length,
  }));
  expect(after.count).toBe(2);
  expect(after.bad).toEqual({ ...before.bad, slug: CLEAN_SLUG });
  expect(after.good).toEqual(before.good);

  // Old URL still finds the tour, and reports the new slug so the page can redirect.
  const viaOld = await t.query(api.tours.getTourBySlug, { slug: BAD_SLUG });
  expect(viaOld?._id).toBe(badId);
  expect(viaOld?.slug).toBe(CLEAN_SLUG);
  const viaNew = await t.query(api.tours.getTourBySlug, { slug: CLEAN_SLUG });
  expect(viaNew?._id).toBe(badId);
  expect(await t.query(api.tours.getTourPricingBySlug, { slug: BAD_SLUG })).not.toBeNull();

  // Running it again is a no-op.
  const again = await t.mutation(internal.migrations.normalizeTourSlugs, { dryRun: false });
  expect(again.changes).toEqual([]);
});

test("renaming a tour keeps the old slug working", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const tourId = (await t.mutation(api.tours.createTour, {
    sessionToken,
    ...baseTour,
    slug: "old-name",
  })) as Id<"tours">;
  await t.mutation(api.tours.updateTour, { sessionToken, tourId, slug: "new-name" });

  const viaOld = await t.query(api.tours.getTourBySlug, { slug: "old-name" });
  expect(viaOld?._id).toBe(tourId);
  expect(viaOld?.slug).toBe("new-name");

  // Another tour may take the old slug later; the live tour then wins.
  const otherId = (await t.mutation(api.tours.createTour, {
    sessionToken,
    ...baseTour,
    slug: "old-name",
  })) as Id<"tours">;
  expect((await t.query(api.tours.getTourBySlug, { slug: "old-name" }))?._id).toBe(otherId);

  expect(await t.query(api.tours.getTourBySlug, { slug: "never-existed" })).toBeNull();
});

test("bulk import with a pre-migration slug updates the tour instead of duplicating it", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);

  // Before the migration ran: the import's slug normalizes to the clean form,
  // but the stored row still has the raw one.
  const tourId = await insertRawTour(t, BAD_SLUG);
  const row = {
    title: "Gandhara updated",
    slug: BAD_SLUG,
    description: "Buddhist sites.",
    durationDays: 6,
    location: "KPK",
    isActive: true,
  };
  let res = await t.mutation(api.tours.bulkUpsert, { sessionToken, rows: [row] });
  expect(res).toMatchObject({ created: 0, updated: 1 });

  // After the migration: the same spreadsheet still maps to the same tour.
  await t.mutation(internal.migrations.normalizeTourSlugs, { dryRun: false });
  res = await t.mutation(api.tours.bulkUpsert, { sessionToken, rows: [row] });
  expect(res).toMatchObject({ created: 0, updated: 1 });

  const tours = await t.run((ctx) => ctx.db.query("tours").take(10));
  expect(tours).toHaveLength(1);
  expect(tours[0]!._id).toBe(tourId);
  expect(tours[0]!.images).toEqual(baseTour.images);
});

test("deleting a tour removes its old-slug redirects", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  const tourId = (await t.mutation(api.tours.createTour, {
    sessionToken,
    ...baseTour,
    slug: "old-name",
  })) as Id<"tours">;
  await t.mutation(api.tours.updateTour, { sessionToken, tourId, slug: "new-name" });
  await t.mutation(api.tours.deleteTour, { sessionToken, tourId });

  expect(await t.run((ctx) => ctx.db.query("tourSlugAliases").take(10))).toEqual([]);
  expect(await t.query(api.tours.getTourBySlug, { slug: "old-name" })).toBeNull();
});
