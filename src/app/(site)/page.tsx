import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { getWhatsAppClickUrl } from "@/lib/whatsapp-server";
import { blogCoverImage } from "@/lib/blog-covers";
import { HomeLanding } from "@/components/landing/HomeLanding";
import type { FeaturedTour } from "@/components/landing/FeaturedToursCarousel";

export const dynamic = "force-dynamic";

export default async function HomePage() {
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

  return (
    <main className="min-h-screen">
      <HomeLanding tours={tours} blogPosts={blogPosts} whatsappUrl={whatsappUrl} />
    </main>
  );
}
