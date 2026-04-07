import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BlogPostCard } from "@/components/blog/BlogPostCard";

export const dynamic = "force-dynamic";

const desc =
  "Travel guides for Hunza, Skardu, Swat, and northern Pakistan — costs, seasons, routes, and trip planning from JunketTours.";

export const metadata: Metadata = {
  title: "Travel Guides",
  description: desc,
  openGraph: {
    title: "Travel Guides | JunketTours",
    description: desc,
    type: "website",
    url: `${getSiteUrl()}/blog`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel Guides | JunketTours",
    description: desc,
  },
};

export default async function BlogIndexPage() {
  let posts: Array<{
    _id: string;
    slug: string;
    title: string;
    metaDescription?: string;
  }> = [];
  let loadError: string | null = null;
  try {
    const client = getConvexServer();
    posts = (await client.query(api.blog.listPublicPosts, {})) as typeof posts;
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Could not load guides from the blogPosts table.";
    posts = [];
  }

  return (
    <main className="min-h-screen py-16 md:py-24">
      <PageContainer>
        <SectionHeader
          variant="onDark"
          eyebrow="Northern Pakistan"
          title="Travel Guides"
          description={desc}
        />
        {loadError ? (
          <div className="mt-16 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900">
            <p className="font-semibold">Guides could not be loaded.</p>
            <p className="mt-1">{loadError}</p>
          </div>
        ) : posts.length > 0 ? (
          <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:gap-10">
            {posts.map((p) => (
              <li key={p._id} className="min-w-0">
                <BlogPostCard post={p} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-16 text-center text-sm text-slate-400">
            No published guides yet — check back soon.
          </p>
        )}
      </PageContainer>
    </main>
  );
}
