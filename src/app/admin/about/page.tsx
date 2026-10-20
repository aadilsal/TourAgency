import { AdminTeamPanel } from "@/components/admin/AdminTeamPanel";
import { AdminAboutContentPanel } from "@/components/admin/AdminAboutContentPanel";

export default function AdminAboutPage() {
  return (
    <div>
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-sun">
          Content
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          About us &amp; team
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted">
          The text, photos, numbers, partner logos and team members on your About Us page.
        </p>
      </header>
      <div className="mt-10">
        <AdminAboutContentPanel />
      </div>
      <div className="mt-10">
        <AdminTeamPanel />
      </div>
    </div>
  );
}

