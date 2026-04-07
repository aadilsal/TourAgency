import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { BlogArticleJsonLd } from "@/components/blog/BlogJsonLd";
import { blogCoverImage } from "@/lib/blog-covers";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

function formatPostDate(createdAt: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(createdAt));
}

function readingMinutes(content: string): number {
  const text = content.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const client = getConvexServer();
    const post = await client.query(api.blog.getPostBySlug, {
      slug: params.slug,
    });
    if (!post) return { title: "Post" };
    const base = getSiteUrl();
    const plain =
      post.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const description =
      post.metaDescription?.trim() ||
      (plain.length > 160 ? `${plain.slice(0, 157)}…` : plain || post.title);
    const title = post.metaTitle?.trim() || post.title;
    return {
      title,
      description,
      openGraph: {
        title: post.title,
        description,
        url: `${base}/blog/${post.slug}`,
        type: "article",
        images: [{ url: blogCoverImage(post.slug), width: 900, height: 600 }],
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description,
      },
    };
  } catch {
    return { title: "Post" };
  }
}

export default async function BlogPostPage({ params }: Props) {
  let post: {
    slug: string;
    title: string;
    content: string;
    metaTitle?: string;
    metaDescription?: string;
    createdAt: number;
  } | null = null;

  try {
    const client = getConvexServer();
    post = await client.query(api.blog.getPostBySlug, { slug: params.slug });
  } catch {
    post = null;
  }
  if (!post) notFound();

  let allPosts: Array<{
    slug: string;
    title: string;
    metaDescription?: string;
  }> = [];
  try {
    const client = getConvexServer();
    allPosts = (await client.query(api.blog.getPosts, {})) as typeof allPosts;
  } catch {
    allPosts = [];
  }

  const related = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const ogDescription =
    post.metaDescription?.trim() ||
    post.content.replace(/<[^>]+>/g, " ").slice(0, 155).trim();
  const publishedIso = new Date(post.createdAt).toISOString();
  const readMin = readingMinutes(post.content);
  const hero = blogCoverImage(post.slug);

  return (
    <main className="min-h-screen pb-20 md:pb-24">
      <BlogArticleJsonLd
        title={post.metaTitle ?? post.title}
        description={ogDescription}
        slug={post.slug}
        datePublished={publishedIso}
      />

      <div className="relative h-[min(42vh,380px)] w-full overflow-hidden md:h-[min(48vh,440px)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-primary via-brand-primary/70 to-brand-primary/30" />
        <PageContainer className="relative flex h-full flex-col justify-end pb-10 pt-28 md:pb-14 md:pt-36">
          <p className="text-sm font-medium text-brand-accent">
            <Link href="/blog" className="hover:underline">
              Travel Guides
            </Link>{" "}
            / Article
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-3xl font-semibold tracking-tight text-white md:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/90">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-brand-accent" aria-hidden />
              {formatPostDate(post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-brand-accent" aria-hidden />
              {readMin} min read
            </span>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="mt-10 md:mt-14">
        <article className="mx-auto max-w-prose">
          <Card className="border-slate-200/90 p-6 shadow-card md:p-10">
            <BlogPostBody content={post.content} />
          </Card>
        </article>

        {related.length > 0 ? (
          <section className="mx-auto mt-16 max-w-content border-t border-white/10 pt-14 md:mt-20 md:pt-16">
            <h2 className="font-display text-2xl font-semibold text-white md:text-3xl">
              Related guides
            </h2>
            <p className="mt-2 text-sm text-brand-muted">
              More articles to plan your trip.
            </p>
            <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.slug} className="min-w-0">
                  <BlogPostCard post={p} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </PageContainer>
    </main>
  );
}
