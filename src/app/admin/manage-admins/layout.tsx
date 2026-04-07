import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";

export default async function ManageAdminsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await getServerSession();
  if (!s || s.role !== "super_admin") {
    redirect("/admin");
  }
  return <>{children}</>;
}
