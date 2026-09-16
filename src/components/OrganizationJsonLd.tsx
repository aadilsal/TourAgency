import { getSiteUrl } from "@/lib/site";
import { BUSINESS, BUSINESS_SAME_AS } from "@/config/business";
import { JsonLdScript } from "@/components/JsonLdScript";

/**
 * Site-wide structured data: the business (TravelAgency, a LocalBusiness
 * subtype) + the WebSite with a sitelinks SearchAction (/tours?q=…).
 * Opening hours and geo coordinates are intentionally omitted until verified.
 */
export function OrganizationJsonLd() {
  const base = getSiteUrl();
  const a = BUSINESS.address;

  const json = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TravelAgency",
        "@id": `${base}/#organization`,
        name: BUSINESS.name,
        description: BUSINESS.description,
        url: base,
        logo: {
          "@type": "ImageObject",
          url: `${base}${BUSINESS.logoPath}`,
          width: 225,
          height: 224,
        },
        image: `${base}${BUSINESS.ogImagePath}`,
        email: BUSINESS.email,
        telephone: BUSINESS.phoneE164,
        address: {
          "@type": "PostalAddress",
          streetAddress: a.streetAddress,
          addressLocality: a.addressLocality,
          addressRegion: a.addressRegion,
          postalCode: a.postalCode,
          addressCountry: a.addressCountry,
        },
        areaServed: [
          { "@type": "Country", name: "Pakistan" },
          "Worldwide",
        ],
        knowsAbout: [
          "Pakistan heritage tours",
          "Cultural tourism",
          "Mughal architecture in Lahore",
          "Gandhara and Taxila archaeology",
          "Hunza and Skardu travel",
          "Pakistan tourist visa invitation letters",
        ],
        knowsLanguage: ["en", "ur"],
        currenciesAccepted: "USD, PKR",
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer service",
            telephone: BUSINESS.phoneE164,
            email: BUSINESS.email,
            availableLanguage: ["English", "Urdu"],
            areaServed: "Worldwide",
          },
        ],
        sameAs: BUSINESS_SAME_AS,
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: BUSINESS.name,
        inLanguage: "en",
        publisher: { "@id": `${base}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${base}/tours?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return <JsonLdScript data={json} />;
}
