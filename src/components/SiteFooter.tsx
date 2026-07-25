import Link from "next/link";
import {
  MapPin,
  BookOpen,
  Sparkles,
  PhoneCall,
  Phone,
  ArrowRight,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { WhatsAppBrandIcon } from "@/components/icons/WhatsAppBrandIcon";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.14 0-3.51.01-4.75.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71C3.41 8.49 3.4 8.86 3.4 12s.01 3.51.07 4.75c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.04-.9-.19-1.39-.32-1.71a2.85 2.85 0 0 0-.69-1.06 2.85 2.85 0 0 0-1.06-.69c-.32-.13-.81-.28-1.71-.32C15.51 4.01 15.14 4 12 4Zm0 3.06A4.94 4.94 0 1 1 12 16.94 4.94 4.94 0 0 1 12 7.06Zm0 1.8A3.14 3.14 0 1 0 12 15.14 3.14 3.14 0 0 0 12 8.86Zm5.14-2.26a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0Z" />
    </svg>
  );
}
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.5 3c.3 2.06 1.46 3.29 3.5 3.42v2.36c-1.18.12-2.21-.27-3.42-1v4.86c0 4.05-2.98 6.36-6.05 6.36-3.28 0-5.53-2.5-5.53-5.4 0-3.05 2.4-5.3 5.28-5.3.37 0 .74.05 1.09.13v2.5c-.32-.1-.66-.16-1.02-.16-1.44 0-2.5 1.03-2.5 2.55 0 1.5 1.07 2.5 2.5 2.5 1.66 0 2.46-1.2 2.46-2.86V3h3.19Z" />
    </svg>
  );
}
import { PageContainer } from "@/components/ui/PageContainer";
import { GovernmentLicenceText } from "@/components/GovernmentLicenceText";
import { SiteFooterVisaLink } from "@/components/visa/SiteFooterVisaLink";
import { normalizeGoogleMapsEmbedUrl } from "@/lib/googleMapsEmbed";

type Props = {
  whatsappUrl: string | null;
  contactPhone?: string;
  officeAddress?: string;
  mapsEmbedUrl?: string;
  governmentLicenseNo?: string;
  governmentLicenseNo2?: string;
};

const linkClass =
  "inline-flex items-center gap-2 text-white/65 transition hover:text-white";

export function SiteFooter({
  whatsappUrl,
  contactPhone,
  officeAddress,
  mapsEmbedUrl,
  governmentLicenseNo,
  governmentLicenseNo2,
}: Props) {
  const phoneDisplay = contactPhone ?? "";
  const mapSrc = normalizeGoogleMapsEmbedUrl(mapsEmbedUrl);

  return (
    <footer className="relative mt-auto bg-brand-primary text-white">
      <PageContainer className="py-14 md:py-16">
        {/* CTA band */}
        <div className="mb-14 flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 p-8 ring-1 ring-white/10 md:flex-row md:items-center md:p-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Ready to explore Pakistan?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Tell us your dates and interests — get an AI-drafted itinerary in
              seconds, or talk to a local expert.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/ai-planner"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-cta px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
            >
              Plan with AI <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Browse tours
            </Link>
          </div>
        </div>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="text-xl font-semibold tracking-tight">
              JunketTours
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-white/65">
              Small-group &amp; private heritage tours across Pakistan — from
              Lahore and Taxila to Hunza and Swat. Welcoming travellers from
              around the world, with AI planning and concierge-style support.
            </p>
            <GovernmentLicenceText
              primary={governmentLicenseNo}
              secondary={governmentLicenseNo2}
              className="mt-3 text-white/45"
            />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-sun">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/tours" className={linkClass}><MapPin className="h-4 w-4 shrink-0 opacity-70" />Tours</Link></li>
              <li><Link href="/guides" className={linkClass}><MapPin className="h-4 w-4 shrink-0 opacity-70" />Province guides</Link></li>
              <li><Link href="/destinations" className={linkClass}><MapPin className="h-4 w-4 shrink-0 opacity-70" />City destinations</Link></li>
              <li><Link href="/blog" className={linkClass}><BookOpen className="h-4 w-4 shrink-0 opacity-70" />Travel guides</Link></li>
              <li><Link href="/ai-planner" className={linkClass}><Sparkles className="h-4 w-4 shrink-0 opacity-70" />AI Planner</Link></li>
              <li><Link href="/about" className={linkClass}>About &amp; FAQs</Link></li>
              <li><Link href="/contact" className={linkClass}><PhoneCall className="h-4 w-4 shrink-0 opacity-70" />Contact us</Link></li>
              <li><SiteFooterVisaLink /></li>
              <li><Link href="/pakistan-tourist-visa-guide" className={linkClass}><FileText className="h-4 w-4 shrink-0 opacity-70" />Visa guide</Link></li>
              <li><Link href="/is-pakistan-safe-for-tourists" className={linkClass}><ShieldCheck className="h-4 w-4 shrink-0 opacity-70" />Is Pakistan safe?</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-sun">
              Contact
            </p>
            <ul className="mt-4 space-y-3 text-sm">
              {phoneDisplay ? (
                <li>
                  <a href={`tel:${phoneDisplay.replace(/\s/g, "")}`} className={linkClass}>
                    <Phone className="h-4 w-4 shrink-0" />
                    {phoneDisplay}
                  </a>
                </li>
              ) : null}
              {officeAddress ? (
                <li className="flex gap-2 text-white/65">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
                  <span className="leading-relaxed">{officeAddress}</span>
                </li>
              ) : null}
              {whatsappUrl ? (
                <li>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    <WhatsAppBrandIcon className="h-5 w-5 shrink-0" />
                    Chat on WhatsApp
                  </a>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-sun">
              Follow along
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://www.instagram.com/junkettoursofficial/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/JunketToursOfficial"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20"
              >
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a
                href="https://www.tiktok.com/@junkettours"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20"
              >
                <TikTokIcon className="h-5 w-5" />
              </a>
            </div>

            {mapSrc ? (
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 shadow-sm">
                <iframe
                  title="Office location"
                  src={mapSrc}
                  className="h-36 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-8 text-xs text-white/50">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-start">
            <Link href="/privacy-policy" className="hover:text-white/80">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-white/80">Terms of Service</Link>
            <Link href="/cancellation-policy" className="hover:text-white/80">Cancellation Policy</Link>
          </div>
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p>© {new Date().getFullYear()} JunketTours. Heritage &amp; culture tours across Pakistan.</p>
            <p>Private &amp; small-group journeys for international travellers.</p>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
