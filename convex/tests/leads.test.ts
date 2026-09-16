import { expect, test } from "vitest";
import rateLimiter from "@convex-dev/rate-limiter/test";
import { api } from "../_generated/api.js";
import { newTest } from "./helpers.test-utils.js";

function leadsTest() {
  const t = newTest();
  rateLimiter.register(t);
  return t;
}

test("public lead capture saves trimmed leads", async () => {
  const t = leadsTest();
  const id = await t.mutation(api.leads.createLead, {
    name: "  Sara  ",
    phone: " +44 7700 900123 ",
    source: "Manual",
    message: "  Hunza in May  ",
  });
  const lead = await t.run((ctx) => ctx.db.get(id));
  expect(lead).toMatchObject({ name: "Sara", phone: "+44 7700 900123", message: "Hunza in May" });
});

test("honeypot submissions are rejected and nothing is stored", async () => {
  const t = leadsTest();
  await expect(
    t.mutation(api.leads.createLead, {
      name: "Bot",
      phone: "123456789",
      source: "Manual",
      website: "http://spam.example",
    }),
  ).rejects.toThrow();
  const rows = await t.run((ctx) => ctx.db.query("leads").collect());
  expect(rows).toHaveLength(0);
});

test("oversized input is rejected", async () => {
  const t = leadsTest();
  await expect(
    t.mutation(api.leads.createLead, {
      name: "x".repeat(500),
      phone: "123456789",
      source: "Manual",
    }),
  ).rejects.toThrow();
});

test("repeated submissions from one contact are rate limited", async () => {
  const t = leadsTest();
  for (let i = 0; i < 5; i++) {
    await t.mutation(api.leads.createLead, { name: "Ali", phone: "+92 300 1112223", source: "Manual" });
  }
  await expect(
    t.mutation(api.leads.createLead, { name: "Ali", phone: "+923001112223", source: "Manual" }),
  ).rejects.toThrow(/several requests/);
  // A different visitor is unaffected.
  await t.mutation(api.leads.createLead, { name: "Maya", phone: "+1 415 555 0101", source: "Manual" });
});
