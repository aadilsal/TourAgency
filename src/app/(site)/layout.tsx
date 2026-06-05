import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { getWhatsAppClickUrl } from "@/lib/whatsapp-server";
import { getConvexServer } from "@/lib/convex-server";
import { api } from "@convex/_generated/api";
import { Suspense } from "react";

async function SiteHeaderData() {
  const whatsappUrl = await getWhatsAppClickUrl();
  return <SiteHeader whatsappUrl={whatsappUrl} />;
}

async function SiteFooterData() {
  const whatsappUrl = await getWhatsAppClickUrl();
  let publicSettings: {
    officeAddress?: string;
    whatsappPhone?: string;
    mapsEmbedUrl?: string;
    governmentLicenseNo?: string;
    governmentLicenseNo2?: string;
  } | null = null;

  try {
    const client = getConvexServer();
    publicSettings = await client.query(api.siteSettings.getPublicSiteSettings, {});
  } catch {
    publicSettings = null;
  }
  return (
    <SiteFooter
      whatsappUrl={whatsappUrl}
      contactPhone={publicSettings?.whatsappPhone}
      officeAddress={publicSettings?.officeAddress}
      mapsEmbedUrl={publicSettings?.mapsEmbedUrl}
      governmentLicenseNo={publicSettings?.governmentLicenseNo}
      governmentLicenseNo2={publicSettings?.governmentLicenseNo2}
    />
  );
}

async function WhatsAppFloatData() {
  const whatsappUrl = await getWhatsAppClickUrl();
  return <WhatsAppFloat url={whatsappUrl} />;
}

export default function SiteChromeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative z-[1] min-h-screen">
      <Suspense fallback={<SiteHeader whatsappUrl={null} />}>
        <SiteHeaderData />
      </Suspense>
      {children}
      <Suspense
        fallback={
          <SiteFooter
            whatsappUrl={null}
            contactPhone={undefined}
            officeAddress={undefined}
            mapsEmbedUrl={undefined}
            governmentLicenseNo={undefined}
            governmentLicenseNo2={undefined}
          />
        }
      >
        <SiteFooterData />
      </Suspense>
      <Suspense fallback={null}>
        <WhatsAppFloatData />
      </Suspense>
    </div>
  );
}
