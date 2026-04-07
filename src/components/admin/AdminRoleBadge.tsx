import { cn } from "@/lib/cn";

const roleLabels: Record<string, string> = {
  super_admin: "Super admin",
  admin: "Admin",
  customer: "Customer",
};

export function AdminRoleBadge({ role }: { role: string }) {
  const label = roleLabels[role] ?? role.replace("_", " ");
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ring-1",
        role === "super_admin" &&
          "bg-violet-100 text-violet-900 ring-violet-200",
        role === "admin" && "bg-sky-100 text-sky-900 ring-sky-200",
        role === "customer" && "bg-slate-100 text-slate-700 ring-slate-200",
        !["super_admin", "admin", "customer"].includes(role) &&
          "bg-amber-50 text-amber-900 ring-amber-200",
      )}
    >
      {label}
    </span>
  );
}
