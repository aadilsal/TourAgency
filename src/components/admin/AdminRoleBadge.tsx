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
        role === "super_admin" && "bg-brand-sun/15 text-brand-sun ring-brand-sun/25",
        role === "admin" && "bg-brand-cta/15 text-brand-cta ring-brand-cta/25",
        role === "customer" && "bg-white/10 text-slate-200 ring-white/15",
        !["super_admin", "admin", "customer"].includes(role) &&
          "bg-brand-forest/12 text-brand-forest ring-brand-forest/25",
      )}
    >
      {label}
    </span>
  );
}
