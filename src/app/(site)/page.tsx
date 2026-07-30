import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { getWhatsAppClickUrl } from "@/lib/whatsapp-server";
import { blogCoverImage } from "@/lib/blog-covers";
import { HomeLandingBelowFold } from "@/components/landing/HomeLandingBelowFold";
import { HomeHero } from "@/components/landing/havezic/HomeHero";
import type { FeaturedTour } from "@/components/landing/FeaturedToursCarousel";
import { Suspense } from "react";

// Render fresh on every request so admin edits reflect instantly (no ISR lag).
export const revalidate = 0;

async function HomePageDeferred() {
  let tours: FeaturedTour[] = [];
  let blogPosts: Array<{
    slug: string;
    title: string;
    metaDescription?: string;
    coverImage: string;
  }> = [];
  const whatsappUrl = await getWhatsAppClickUrl();

  try {
    const client = getConvexServer();
    const raw = (await client.query(api.tours.listActiveToursForExplore, {})) as Array<{
      _id: string;
      slug: string;
      title: string;
      description: string;
      types?: string[];
      price: number;
      pricePkr?: number;
      priceUsd?: number;
      perHeadPrices?: Array<{ persons: number; pricePkr?: number; priceUsd?: number }>;
      durationDays: number;
      location: string;
      images: string[];
      isActive: boolean;
    }>;
    tours = raw.map((t) => ({
        _id: t._id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        types: t.types ?? [],
        price: t.price,
        pricePkr: t.pricePkr,
        priceUsd: t.priceUsd,
        perHeadPrices: t.perHeadPrices ?? [],
        durationDays: t.durationDays,
        location: t.location,
        images: t.images ?? [],
      }));
  } catch {
    tours = [];
  }

  try {
    const client = getConvexServer();
    const rawPosts = (await client.query(api.blog.listPublicPosts, {})) as Array<{
      slug: string;
      title: string;
      metaDescription?: string;
    }>;
    blogPosts = rawPosts.map((p) => ({
      ...p,
      coverImage: blogCoverImage(p.slug),
    }));
  } catch {
    blogPosts = [];
  }

  return <HomeLandingBelowFold tours={tours} blogPosts={blogPosts} whatsappUrl={whatsappUrl} />;
}

export default async function HomePage() {
  return (
    <main className="min-h-screen">
      <HomeHero />
      <Suspense
        fallback={
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-black/5" />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl bg-black/5"
                />
              ))}
            </div>
          </div>
        }
      >
        <HomePageDeferred />
      </Suspense>
    </main>
  );
}
