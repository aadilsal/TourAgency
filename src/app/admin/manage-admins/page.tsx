import { ManageAdminsClient } from "@/components/admin/ManageAdminsClient";

export default function ManageAdminsPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">
        Manage admins
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Choose who can use this admin area: add a new admin, or give or remove admin access for
        existing accounts. Only the main owner account can do this.
      </p>
      <div className="mt-8">
        <ManageAdminsClient />
      </div>
    </main>
  );
}
