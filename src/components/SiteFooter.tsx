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
    <footer className="relative mt-auto border-t border-border bg-background text-foreground">
      <PageContainer className="py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link
              href="/"
              className="text-xl font-semibold tracking-tight text-foreground"
            >
              JunketTours
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Premium northern Pakistan travel — AI planning, verified tours,
              and concierge-style support from Hunza to Skardu.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-havezic-primary">
              Explore
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  href="/tours"
                  className="inline-flex items-center gap-2 text-muted hover:text-havezic-primary"
                >
                  <Compass className="h-4 w-4 shrink-0 opacity-80" />
                  Tours
                </Link>
              </li>
              <li>
                <Link
                  href="/destinations"
                  className="inline-flex items-center gap-2 text-muted hover:text-havezic-primary"
                >
                  <MapPin className="h-4 w-4 shrink-0 opacity-80" />
                  Destinations
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 text-muted hover:text-havezic-primary"
                >
                  <BookOpen className="h-4 w-4 shrink-0 opacity-80" />
                  Travel guides
                </Link>
              </li>
              <li>
                <Link
                  href="/ai-planner"
                  className="inline-flex items-center gap-2 text-muted hover:text-havezic-primary"
                >
                  <Sparkles className="h-4 w-4 shrink-0 opacity-80" />
                  AI Planner
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-muted hover:text-havezic-primary"
                >
                  <PhoneCall className="h-4 w-4 shrink-0 opacity-80" />
                  Contact us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-havezic-primary">
              Contact
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {phoneDisplay ? (
                <li>
                  <a
                    href={`tel:${phoneDisplay.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 text-muted hover:text-havezic-primary"
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
                    className="inline-flex items-center justify-center rounded-full bg-havezic-primary p-2 text-white transition hover:bg-havezic-primary-hover"
                    aria-label="Chat on WhatsApp — +92 320 9973486"
                  >
                    <WhatsAppBrandIcon className="h-7 w-7 shrink-0" />
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-havezic-primary">
              Social
            </p>
            <ul className="mt-4 flex flex-wrap gap-4 text-sm">
              <li>
                <a
                  href="https://www.instagram.com/junkettoursofficial/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-muted hover:text-havezic-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/JunketToursOfficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-muted hover:text-havezic-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://www.tiktok.com/@junkettours"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-muted hover:text-havezic-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                  TikTok
                </a>
              </li>
            </ul>
          </div>
        </div>
        {(mapsEmbedUrl || officeAddress) && (
          <div className="mt-14 border-t border-border pt-10">
            <p className="text-xs font-bold uppercase tracking-wider text-havezic-primary">
              Visit us
            </p>
            {officeAddress ? (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                {officeAddress}
              </p>
            ) : null}
            {mapsEmbedUrl ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-havezic-background-light shadow-sm">
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
        <p className="mt-14 border-t border-border pt-8 text-center text-xs text-muted">
          © {new Date().getFullYear()} JunketTours. Northern Pakistan tours.
        </p>
      </PageContainer>
    </footer>
  );
}
