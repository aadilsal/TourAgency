import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";
import { getSiteUrl } from "@/lib/site";
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

const SITE_TITLE = "Plan your Pakistan trip in seconds | JunketTours";
const SITE_DESCRIPTION =
  "Culture & history tours across Pakistan — Mughal cities, Gandhara sites, and northern valley heritage. AI-assisted planning, visa support, and concierge booking for travellers worldwide.";
const OG_IMAGE = "/images/marketing/hero-heritage.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_TITLE,
    template: "%s | JunketTours",
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "JunketTours",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: getSiteUrl(),
    locale: "en_US",
    images: [{ url: OG_IMAGE, alt: "JunketTours — heritage tours across Pakistan" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
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
      </body>
    </html>
  );
}
