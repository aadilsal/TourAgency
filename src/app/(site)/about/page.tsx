import { PageContainer } from "@/components/ui/PageContainer";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { AboutPageClient } from "@/components/about/AboutPageClient";

export default async function AboutPage() {
  const client = getConvexServer();
  const team = await client.query(api.team.listPublic, {});
  const content = await client.query(api.about.getPublic, {});

  return (
    <main className="min-h-screen">
      <AboutPageClient team={team} content={content} />
      <PageContainer className="sr-only">
        About page content
      </PageContainer>
    </main>
  );
}

