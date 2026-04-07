import type { Metadata } from "next";
import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/AppProviders";

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

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Plan your Pakistan trip in seconds | JunketTours",
    template: "%s | JunketTours",
  },
  description:
    "Personalized AI itineraries, verified northern Pakistan tours, and instant booking. Hunza, Skardu, Swat & more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} relative min-h-screen font-sans text-slate-200 antialiased`}
      >
        <div className="noise-overlay" aria-hidden />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
