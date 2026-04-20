import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { getWhatsAppClickUrl } from "@/lib/whatsapp-server";
import { blogCoverImage } from "@/lib/blog-covers";
import { HomeLandingAboveFold } from "@/components/landing/HomeLandingAboveFold";
import { HomeLandingBelowFold } from "@/components/landing/HomeLandingBelowFold";
import type { FeaturedTour } from "@/components/landing/FeaturedToursCarousel";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

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
    const raw = (await client.query(api.tours.getTours, {})) as Array<{
      _id: string;
      slug: string;
      title: string;
      description: string;
      types?: string[];
      price: number;
      durationDays: number;
      location: string;
      images: string[];
      isActive: boolean;
    }>;
    tours = raw
      .filter((t) => t.isActive)
      .map((t) => ({
        _id: t._id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        types: t.types ?? [],
        price: t.price,
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
      <HomeLandingAboveFold />
      <Suspense fallback={null}>
        <HomePageDeferred />
      </Suspense>
    </main>
  );
}
