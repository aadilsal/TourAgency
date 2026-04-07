import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { blogCoverImage } from "@/lib/blog-covers";

export type BlogPostCardData = {
  slug: string;
  title: string;
  metaDescription?: string;
};

function excerpt(post: BlogPostCardData): string {
  if (post.metaDescription?.trim()) return post.metaDescription.trim();
  return "Practical tips and route ideas for northern Pakistan.";
}

export function BlogPostCard({ post }: { post: BlogPostCardData }) {
  const img = blogCoverImage(post.slug);

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <Card
        hover
        className="flex h-full min-h-[28rem] flex-col overflow-hidden p-0 transition-shadow duration-300"
      >
        <div className="relative h-52 bg-slate-200 sm:h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent opacity-60" />
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h2 className="line-clamp-2 text-lg font-bold leading-snug text-brand-ink group-hover:text-brand-primary md:text-xl">
            {post.title}
          </h2>
          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-brand-muted">
            {excerpt(post)}
          </p>
          <span className="mt-4 text-sm font-semibold text-brand-accent">
            Read guide →
          </span>
        </div>
      </Card>
    </Link>
  );
}
