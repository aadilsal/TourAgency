import { getServerSession } from "@/lib/session";
import { getConvexServer } from "@/lib/server/convex-server";
import { api } from "@convex/_generated/api";
import { formatGovernmentLicenceLine } from "@/lib/governmentLicenses";
import { SiteHeaderNav } from "./SiteHeaderNav";

export async function SiteHeader() {
  const session = await getServerSession();
  // Government licence under the brand name (Settings → licence numbers).
  let licenceLine: string | undefined;
  try {
    const settings = await getConvexServer().query(api.siteSettings.getPublicSiteSettings, {});
    licenceLine = formatGovernmentLicenceLine(
      settings?.governmentLicenseNo,
      (settings as { governmentLicenseNo2?: string } | null)?.governmentLicenseNo2,
    );
  } catch {
    licenceLine = undefined;
  }

  return (
    <SiteHeaderNav
      licenceLine={licenceLine}
      initialSession={
        session
          ? { email: session.email, role: session.role, name: session.name }
          : null
      }
    />
  );
}
