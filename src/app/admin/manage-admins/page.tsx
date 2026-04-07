import { ManageAdminsClient } from "@/components/admin/ManageAdminsClient";

export default function ManageAdminsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">
        Manage admins 🔐
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Super-admin only: create admins, promote customers, demote admins. Role
        badges in the table.
      </p>
      <div className="mt-8">
        <ManageAdminsClient />
      </div>
    </main>
  );
}
