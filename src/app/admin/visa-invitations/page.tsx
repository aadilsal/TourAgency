import { AdminVisaInvitationsPanel } from "@/components/admin/AdminVisaInvitationsPanel";

export default function AdminVisaInvitationsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Visa invitations</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Review tourist visa invitation requests and update their status.
      </p>
      <div className="mt-8">
        <AdminVisaInvitationsPanel />
      </div>
    </main>
  );
}
