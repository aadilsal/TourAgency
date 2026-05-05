import { cache } from "react";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";

export const loadTourBySlug = cache(async (slug: string) => {
  const client = getConvexServer();
  return await client.query(api.tours.getTourBySlug, { slug });
});

