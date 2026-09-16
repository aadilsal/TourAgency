import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a free JunketTours account to track bookings and save trip plans.",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}

