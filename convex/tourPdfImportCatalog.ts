import { internalQuery } from "./_generated/server.js";

export const listCatalogForPdfImport = internalQuery({
  args: {},
  handler: async (ctx) => {
    const destinations = await ctx.db.query("destinations").collect();
    const provinces = await ctx.db.query("provinces").collect();
    return {
      destinations: destinations
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((d) => ({ slug: d.slug, name: d.name })),
      provinces: provinces
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
        .map((p) => ({ slug: p.slug, name: p.name })),
    };
  },
});
