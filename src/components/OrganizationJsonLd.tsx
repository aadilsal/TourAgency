import { getSiteUrl } from "@/lib/site";

export function OrganizationJsonLd() {
  const base = getSiteUrl();
  const json = {
    "@context": "https://schema.org",
    "@type": ["Organization", "TravelAgency"],
    "@id": `${base}/#organization`,
    name: "JunketTours",
    description:
      "Culture, history and northern heritage tours across Pakistan — heritage cities, ancient sites, and valley traditions.",
    knowsAbout: [
      "Cultural tourism",
      "Heritage travel",
      "Pakistan history",
      "Northern Pakistan heritage",
    ],
    url: base,
    logo: `${base}/public/images-removebg-preview.png`,
    image: `${base}/public/images-removebg-preview.png`,
    telephone: "+923209973486",
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: "+923209973486",
        availableLanguage: ["en", "ur"],
        areaServed: "PK",
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "156, M Block, Main Blvd, near Khokhar Chowk, Block M Phase 2 Johar Town",
      addressLocality: "Lahore",
      postalCode: "54000",
      addressCountry: "PK",
    },
    sameAs: [
      "https://www.instagram.com/junkettoursofficial/",
      "https://www.facebook.com/JunketToursOfficial",
      "https://www.tiktok.com/@junkettours",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}

