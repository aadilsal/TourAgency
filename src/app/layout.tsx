import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";
import { getSiteUrl } from "@/lib/site";
import { DEFAULT_OG_IMAGE, SITE_NAME } from "@/lib/seo";
import { BUSINESS } from "@/config/business";
import { OrganizationJsonLd } from "@/components/OrganizationJsonLd";
import { WebVitalsReporter } from "@/components/analytics/WebVitalsReporter";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_TITLE = "Pakistan Heritage & Culture Tours | JunketTours";
const SITE_DESCRIPTION =
  "Licensed Lahore-based tour operator. Private heritage, culture & northern-valley tours of Pakistan with English-speaking guides, visa support and USD pricing.";

// Icons come from Next's file conventions: src/app/favicon.ico, icon.png,
// apple-icon.png and manifest.ts — no manual `icons` override here.
// Canonicals are set per page (see src/lib/seo.ts buildMetadata); a root-level
// canonical would be inherited by every page and point them all at "/".
export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Pakistan tours",
    "Pakistan heritage tours",
    "Lahore tour operator",
    "Pakistan travel agency",
    "Hunza tours",
    "Pakistan tourist visa invitation",
  ],
  authors: [{ name: SITE_NAME, url: getSiteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "travel",
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE.url],
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets env(safe-area-inset-*) work so sticky bottom bars clear the iPhone home indicator.
  viewportFit: "cover",
  themeColor: BUSINESS.themeColor,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID;
  return (
    <html lang="en" className="theme-havezic">
      <head>
        {/* Still used by landing/about heroes and blog covers. */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} relative min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <WebVitalsReporter />
        <AnalyticsScripts gaId={gaId} />
        <OrganizationJsonLd />
        <div className="noise-overlay" aria-hidden />
        <AppProviders>{children}</AppProviders>
        <CookieConsentBanner />
        {/* Cookieless, first-party — no consent required. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
