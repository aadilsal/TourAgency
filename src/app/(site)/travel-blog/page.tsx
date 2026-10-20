import { getConvexServer } from "@/lib/server/convex-server";
import { api } from "@convex/_generated/api";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { PageContainer } from "@/components/ui/PageContainer";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BlogPostCard } from "@/components/blog/BlogPostCard";

export const revalidate = 0;

const desc =
  "Stories, news and travel notes from the JunketTours team — trips we've run, festivals, new routes and tips for travelling in Pakistan.";

export const metadata: Metadata = buildMetadata({
  title: "Blog — Pakistan Travel Stories",
  description: desc,
  path: "/travel-blog",
});

/** Blog posts (kind = "blog"). Travel guides stay on /blog. */
export default async function TravelBlogIndexPage() {
  let posts: Array<{
    _id: string;
    slug: string;
    title: string;
    metaDescription?: string;
  }> = [];
  let loadError: string | null = null;
  try {
    const client = getConvexServer();
    posts = (await client.query(api.blog.listPublicPosts, { kind: "blog" })) as typeof posts;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Could not load blog posts.";
    posts = [];
  }

  return (
    <main className="min-h-screen py-16 md:py-24">
      <PageContainer>
        <SectionHeader variant="onDark" eyebrow="Stories & news" title="Blog" description={desc} />
        {loadError ? (
          <div className="mt-16 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900">
            <p className="font-semibold">Blog posts could not be loaded.</p>
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
            No blog posts yet — check back soon.
          </p>
        )}
      </PageContainer>
    </main>
  );
}
