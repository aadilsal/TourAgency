import { AdminUsersTable } from "@/components/admin/AdminUsersTable";

export default function AdminUsersPage() {
  return (
    <main>
      <h1 className="text-2xl font-semibold text-zinc-900">Users</h1>
      <p className="mt-1 text-sm text-zinc-500">
        All registered users — open View for phone, verification, and join date.
        Role changes: Manage admins 🔐.
      </p>
      <div className="mt-8">
        <AdminUsersTable />
      </div>
    </main>
  );
}
