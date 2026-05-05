import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";
import { PageContainer } from "@/components/ui/PageContainer";
import { Card } from "@/components/ui/Card";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { BlogArticleJsonLd } from "@/components/blog/BlogJsonLd";
import { BreadcrumbJsonLd } from "@/components/BreadcrumbJsonLd";
import { blogCoverImage } from "@/lib/blog-covers";
import { loadBlogPostBySlug } from "@/lib/blog-server";
import { getConvexServer } from "@/lib/convex-server";
import Image from "next/image";

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
    const post = await loadBlogPostBySlug(params.slug);
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
  const post = await loadBlogPostBySlug(params.slug);
  if (!post) notFound();

  let related: Array<{
    slug: string;
    title: string;
    metaDescription?: string;
  }> = [];
  try {
    const client = getConvexServer();
    related = (await client.query(api.blog.listRelatedPublic, {
      slug: post.slug,
      limit: 3,
    })) as typeof related;
  } catch {
    related = [];
  }
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
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Travel Guides", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
      />

      <div className="relative h-[min(42vh,380px)] w-full overflow-hidden md:h-[min(48vh,440px)]">
        <Image
          src={hero}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/30" />
        <PageContainer className="relative flex h-full flex-col justify-end pb-10 pt-28 md:pb-14 md:pt-36">
          <p className="text-sm font-medium text-white/85">
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
              <Calendar className="h-4 w-4 shrink-0 text-havezic-primary" aria-hidden />
              {formatPostDate(post.createdAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-havezic-primary" aria-hidden />
              {readMin} min read
            </span>
          </div>
        </PageContainer>
      </div>

      <PageContainer className="mt-10 md:mt-14">
        <article className="mx-auto max-w-prose">
          <Card className="p-6 shadow-sm md:p-10">
            <BlogPostBody content={post.content} />
          </Card>
        </article>

        {related.length > 0 ? (
          <section className="mx-auto mt-16 max-w-content border-t border-white/10 pt-14 md:mt-20 md:pt-16">
            <h2 className="font-display text-2xl font-semibold text-foreground md:text-3xl">
              Related guides
            </h2>
            <p className="mt-2 text-sm text-muted">
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
