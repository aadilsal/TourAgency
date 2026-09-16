import { expect, test } from "vitest";
import { api } from "../_generated/api.js";
import { newTest, signIn } from "./helpers.test-utils.js";

test("saving one settings screen never wipes fields owned by another screen", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);

  // Settings screen
  await t.mutation(api.siteSettings.upsertAdminSiteSettings, {
    sessionToken,
    officeAddress: "156 M Block, Johar Town, Lahore",
    whatsappPhone: "+92 320 9973486",
    contactEmail: "info@junkettours.co",
    website: "https://www.junkettours.co",
    mapsEmbedUrl: "https://www.google.com/maps/embed?pb=abc",
  });
  // Itinerary template screen (sends only its own fields)
  await t.mutation(api.siteSettings.upsertAdminSiteSettings, {
    sessionToken,
    paymentTerms: [{ percent: 100, title: "Full" }],
  });
  // Contact screen (no website field)
  await t.mutation(api.siteSettings.upsertAdminSiteSettings, {
    sessionToken,
    officeAddress: "156 M Block, Johar Town, Lahore",
    whatsappPhone: "+92 320 9973486",
    contactEmail: "info@junkettours.co",
  });

  const s = await t.query(api.siteSettings.getAdminSiteSettings, { sessionToken });
  expect(s.officeAddress).toBe("156 M Block, Johar Town, Lahore");
  expect(s.website).toBe("https://www.junkettours.co");
  expect(s.mapsEmbedUrl).toContain("google.com/maps/embed");
  expect(s.paymentTerms).toEqual([{ percent: 100, title: "Full" }]);
});

test("never-set fields show the real business defaults, not placeholders", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);

  const pub = await t.query(api.siteSettings.getPublicSiteSettings, {});
  expect(pub.contactEmail).toBe("info@junkettours.co");
  expect(pub.whatsappPhone).toBe("+92 320 9973486");
  expect(pub.officeAddress).toContain("Johar Town");
  expect(pub.website).toBe("https://www.junkettours.co");

  const admin = await t.query(api.siteSettings.getAdminSiteSettings, { sessionToken });
  // Raw values for the form are null (never set), fallbacks are separate.
  expect(admin.stored.contactEmail).toBeNull();
  expect(admin.fallbacks.contactEmail).toBe("info@junkettours.co");
});

test("legacy placeholder values stored by the old form read as unset", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  await t.run(async (ctx) => {
    await ctx.db.insert("siteSettings", {
      key: "global",
      whatsappPhone: "+92 300 0000000",
      contactEmail: "hello@junkettours.example",
      updatedAt: Date.now(),
    });
  });
  const pub = await t.query(api.siteSettings.getPublicSiteSettings, {});
  expect(pub.whatsappPhone).toBe("+92 320 9973486");
  expect(pub.contactEmail).toBe("info@junkettours.co");
  const admin = await t.query(api.siteSettings.getAdminSiteSettings, { sessionToken });
  expect(admin.stored.whatsappPhone).toBeNull();
});

test("an explicitly cleared field stays cleared (fallback does not re-appear)", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  await t.mutation(api.siteSettings.upsertAdminSiteSettings, {
    sessionToken,
    governmentLicenseNo: "DTS-123",
    officeAddress: "Old office",
  });
  await t.mutation(api.siteSettings.upsertAdminSiteSettings, {
    sessionToken,
    officeAddress: "",
  });
  const admin = await t.query(api.siteSettings.getAdminSiteSettings, { sessionToken });
  expect(admin.stored.officeAddress).toBe("");
  expect(admin.officeAddress).toBe("");
  expect(admin.stored.governmentLicenseNo).toBe("DTS-123");
  const pub = await t.query(api.siteSettings.getPublicSiteSettings, {});
  expect(pub.officeAddress).toBe("");
});

test("an invalid maps URL is rejected instead of silently dropped", async () => {
  const t = newTest();
  const sessionToken = await signIn(t);
  await t.mutation(api.siteSettings.upsertAdminSiteSettings, {
    sessionToken,
    mapsEmbedUrl: "https://www.google.com/maps/embed?pb=keep",
  });
  await expect(
    t.mutation(api.siteSettings.upsertAdminSiteSettings, {
      sessionToken,
      mapsEmbedUrl: "not a url",
    }),
  ).rejects.toThrow(/maps link/i);
  const admin = await t.query(api.siteSettings.getAdminSiteSettings, { sessionToken });
  expect(admin.stored.mapsEmbedUrl).toContain("pb=keep");
});
