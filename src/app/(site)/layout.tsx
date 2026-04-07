import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { getWhatsAppClickUrl } from "@/lib/whatsapp-server";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";

export default async function SiteChromeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const whatsappUrl = await getWhatsAppClickUrl();
  let publicSettings: {
    officeAddress?: string;
    whatsappPhone?: string;
    mapsEmbedUrl?: string;
  } | null = null;

  try {
    const client = getConvexServer();
    publicSettings = await client.query(api.siteSettings.getPublicSiteSettings, {});
  } catch {
    publicSettings = null;
  }

  return (
    <div className="relative z-[1] min-h-screen">
      <SiteHeader whatsappUrl={whatsappUrl} />
      {children}
      <SiteFooter
        whatsappUrl={whatsappUrl}
        contactPhone={publicSettings?.whatsappPhone}
        officeAddress={publicSettings?.officeAddress}
        mapsEmbedUrl={publicSettings?.mapsEmbedUrl}
      />
      <WhatsAppFloat url={whatsappUrl} />
    </div>
  );
}
