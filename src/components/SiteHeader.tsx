import { getServerSession } from "@/lib/session";
import { SiteHeaderNav } from "./SiteHeaderNav";

type Props = {
  whatsappUrl: string | null;
};

export async function SiteHeader({ whatsappUrl }: Props) {
  const session = await getServerSession();

  return (
    <SiteHeaderNav
      whatsappUrl={whatsappUrl}
      initialSession={
        session
          ? { email: session.email, role: session.role, name: session.name }
          : null
      }
    />
  );
}
