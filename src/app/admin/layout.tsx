import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { AdminSessionKeeper } from "@/components/admin/shared/AdminSessionKeeper";
import { PageContainer } from "@/components/ui/PageContainer";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getServerSession();
  if (!s) redirect("/login?next=/admin");
  if (s.role !== "admin" && s.role !== "super_admin") {
    redirect("/dashboard");
  }
  const showManageAdmins = s.role === "super_admin";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminSessionKeeper />
      <AdminTopBar email={s.email} role={s.role} showManageAdmins={showManageAdmins} />
      <PageContainer className="flex gap-8 py-8 md:gap-10 md:py-10">
        <AdminSidebar showManageAdmins={showManageAdmins} />
        <div className="min-w-0 flex-1">
          {children}
        </div>
      </PageContainer>
    </div>
  );
}
