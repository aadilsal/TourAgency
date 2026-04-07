import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { DashboardLayoutClient } from "@/components/DashboardLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getServerSession();
  if (!s) redirect("/login?next=/dashboard");
  const showAdminLink =
    s.role === "admin" || s.role === "super_admin";
  return (
    <DashboardLayoutClient
      email={s.email}
      name={s.name}
      role={s.role}
      showAdminLink={showAdminLink}
    >
      {children}
    </DashboardLayoutClient>
  );
}
