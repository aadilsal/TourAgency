import { getServerSession } from "@/lib/session";
import { SiteHeaderNav } from "./SiteHeaderNav";

export async function SiteHeader() {
  const session = await getServerSession();

  return (
    <SiteHeaderNav
      initialSession={
        session
          ? { email: session.email, role: session.role, name: session.name }
          : null
      }
    />
  );
}
