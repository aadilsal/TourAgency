import Link from "next/link";
import {
  Compass,
  MapPin,
  BookOpen,
  Sparkles,
  PhoneCall,
  Phone,
  ExternalLink,
} from "lucide-react";
import { WhatsAppBrandIcon } from "@/components/icons/WhatsAppBrandIcon";
import { PageContainer } from "@/components/ui/PageContainer";

type Props = {
  whatsappUrl: string | null;
  contactPhone?: string;
  officeAddress?: string;
  mapsEmbedUrl?: string;
};

export function SiteFooter({
  whatsappUrl,
  contactPhone,
  officeAddress,
  mapsEmbedUrl,
}: Props) {
  const phoneDisplay = contactPhone ?? "";
  return (
    <footer className="relative mt-auto border-t border-white/10 bg-gradient-to-b from-brand-primary to-[#061f33] text-white">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      <PageContainer className="relative py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              className="font-display text-xl font-semibold tracking-tight text-white"
            >
              JunketTours
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Premium northern Pakistan travel — AI planning, verified tours,
              and concierge-style support from Hunza to Skardu.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-accent">
              Explore
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href="/tours"
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white"
                >
                  <Compass className="h-4 w-4 shrink-0 opacity-80" />
                  Tours
                </Link>
              </li>
              <li>
                <Link
                  href="/destinations"
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white"
                >
                  <MapPin className="h-4 w-4 shrink-0 opacity-80" />
                  Destinations
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white"
                >
                  <BookOpen className="h-4 w-4 shrink-0 opacity-80" />
                  Travel guides
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-planner"
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white"
                >
                  <Sparkles className="h-4 w-4 shrink-0 opacity-80" />
                  AI Planner
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white"
                >
                  <PhoneCall className="h-4 w-4 shrink-0 opacity-80" />
                  Contact us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-accent">
              Contact
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {phoneDisplay ? (
                <li>
                  <a
                    href={`tel:${phoneDisplay.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 text-white/80 hover:text-white"
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    {phoneDisplay}
                  </a>
                </li>
              ) : null}
              {whatsappUrl ? (
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-lg p-2 text-[#25D366] transition hover:bg-white/10"
                    aria-label="Chat on WhatsApp — +92 320 9973486"
                  >
                    <WhatsAppBrandIcon className="h-7 w-7 shrink-0" />
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-accent">
              Social
            </p>
            <ul className="mt-4 flex flex-wrap gap-4 text-sm">
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-white/80 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>
        {(mapsEmbedUrl || officeAddress) && (
          <div className="mt-14 border-t border-white/10 pt-10">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-accent">
              Visit us
            </p>
            {officeAddress ? (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
                {officeAddress}
              </p>
            ) : null}
            {mapsEmbedUrl ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/15 bg-black/20 shadow-lg">
                <iframe
                  title="Office location"
                  src={mapsEmbedUrl}
                  className="h-48 w-full max-w-lg"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            ) : null}
          </div>
        )}
        <p className="mt-14 border-t border-white/10 pt-8 text-center text-xs text-white/50">
          © {new Date().getFullYear()} JunketTours. Northern Pakistan tours.
        </p>
      </PageContainer>
    </footer>
  );
}
