import { writeFileSync } from "fs";
import { SITES_BY_PROVINCE } from "../src/lib/sites-data.ts";

const rows = [];
for (const [provinceSlug, sites] of Object.entries(SITES_BY_PROVINCE)) {
  for (const s of sites) {
    rows.push({
      provinceSlug,
      slug: s.slug,
      name: s.name,
      type: s.type,
      summary: s.summary,
      history: s.history,
      ...(s.city ? { city: s.city } : {}),
      ...(s.era ? { era: s.era } : {}),
      ...(s.unesco ? { unesco: s.unesco } : {}),
      ...(s.heroExternalUrl ? { heroExternalUrl: s.heroExternalUrl } : {}),
      ...(s.destinationSlug ? { destinationSlug: s.destinationSlug } : {}),
      featured: s.featured,
      sortOrder: s.sortOrder,
    });
  }
}

writeFileSync(
  "convex/lib/sitesSeed.ts",
  `/** Auto-generated from src/lib/sites-data.ts — run: npx tsx scripts/gen-sites-seed.mjs */\nexport const SITES_SEED_ROWS = ${JSON.stringify(rows, null, 2)} as const;\n`,
);
console.log(`Wrote ${rows.length} site seed rows`);
