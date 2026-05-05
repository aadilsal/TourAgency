import { mutation } from "./_generated/server.js";
import { requireAdmin } from "./lib/authHelpers.js";

const TOUR_DESTINATION_MULTI_HINTS: Record<string, string[]> = {
  "hunza-valley-explorer": ["hunza", "naran"],
  "skardu-shigar-adventure": ["skardu", "hunza"],
  "swat-summer-retreat": ["swat"],
  "naran-lake-saif-ul-malook": ["naran", "hunza"],
};

const sampleTours = [
  {
    title: "Hunza Valley Explorer",
    slug: "hunza-valley-explorer",
    description:
      "A polished northern Pakistan showcase with Attabad Lake, Karimabad, Baltit Fort, and Passu's glacier viewpoints.",
    types: ["family", "adventure"],
    price: 189000,
    durationDays: 7,
    location: "Gilgit-Baltistan",
    images: [
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80",
    ],
    imageFolderKey: "tours/hunza-valley-explorer",
    itinerary: [
      {
        day: 1,
        title: "Arrive Islamabad",
        description:
          "Airport pickup, welcome briefing, and overnight stay with a trip overview.",
      },
      {
        day: 2,
        title: "Drive to Chilas",
        description:
          "Begin the Karakoram Highway journey with riverside stops and mountain photography.",
      },
      {
        day: 3,
        title: "Reach Karimabad",
        description:
          "Cross into Hunza, check in, and enjoy sunset views across the valley.",
      },
      {
        day: 4,
        title: "Baltit Fort & Eagle Nest",
        description:
          "Explore the heritage fort, local bazaar, and the highest viewpoint above the valley.",
      },
      {
        day: 5,
        title: "Attabad Lake & Gulmit",
        description:
          "Boating, lakefront photography, and a relaxed lunch with turquoise water views.",
      },
    ],
    isActive: true,
  },
  {
    title: "Skardu & Shigar Adventure",
    slug: "skardu-shigar-adventure",
    description:
      "A premium Skardu circuit with cold desert dunes, royal fort heritage, and dramatic Karakoram scenery.",
    types: ["adventure", "corporate"],
    price: 219000,
    durationDays: 8,
    location: "Skardu",
    images: [
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1441829266145-b7a2de8db338?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=80",
    ],
    imageFolderKey: "tours/skardu-shigar-adventure",
    itinerary: [
      {
        day: 1,
        title: "Arrive Skardu",
        description:
          "Flight arrival or scenic road transfer, then rest and acclimatize at the hotel.",
      },
      {
        day: 2,
        title: "Shigar Fort & orchard walk",
        description:
          "A heritage day with fort interiors, village lanes, and apricot orchards.",
      },
      {
        day: 3,
        title: "Sarfaranga Cold Desert",
        description:
          "4x4 experience across the dunes with optional dune bashing and sunset stops.",
      },
      {
        day: 4,
        title: "Upper Kachura Lake",
        description:
          "Boat on the emerald lake and enjoy a relaxed picnic in the pine forest setting.",
      },
      {
        day: 5,
        title: "Shangrila & Soq Valley",
        description:
          "Classic Skardu postcard views with plenty of photography time and tea stops.",
      },
    ],
    isActive: true,
  },
  {
    title: "Swat Summer Retreat",
    slug: "swat-summer-retreat",
    description:
      "A family-friendly alpine escape through Mingora, Malam Jabba, Kalam, and Mahodand-style lake scenery.",
    types: ["family", "budget"],
    price: 146000,
    durationDays: 5,
    location: "Khyber Pakhtunkhwa",
    images: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80",
    ],
    imageFolderKey: "tours/swat-summer-retreat",
    itinerary: [
      {
        day: 1,
        title: "Depart for Swat",
        description:
          "Road transfer, lunch stop en route, and check-in near Mingora or Fizagat.",
      },
      {
        day: 2,
        title: "Malam Jabba excursion",
        description:
          "Chairlift, ridge views, and a relaxed mountain lunch with family photo time.",
      },
      {
        day: 3,
        title: "Kalam Valley drive",
        description:
          "Enter the upper valley, stop for river views, and settle into the forest lodge.",
      },
      {
        day: 4,
        title: "Mahodand-style lake day",
        description:
          "Jeep transfer, alpine lake photography, and a picnic-style outdoor lunch.",
      },
    ],
    isActive: true,
  },
  {
    title: "Naran & Lake Saif ul Malook",
    slug: "naran-lake-saif-ul-malook",
    description:
      "A high-demand summer tour built for quick weekend sales with lake access, jeep rides, and scenic valley stays.",
    types: ["family", "budget"],
    price: 98000,
    durationDays: 4,
    location: "Mansehra District",
    images: [
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1523818518166-84f6d1b2c1f7?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1600&q=80",
    ],
    imageFolderKey: "tours/naran-lake-saif-ul-malook",
    itinerary: [
      {
        day: 1,
        title: "Travel to Naran",
        description:
          "Depart early, stop for lunch, and settle into the riverside hotel.",
      },
      {
        day: 2,
        title: "Lake Saif ul Malook",
        description:
          "Jeep ride to the lake, time for boating or photos, and sunset return.",
      },
      {
        day: 3,
        title: "Babusar Top route",
        description:
          "Take the upper mountain route for glacier views and roadside photography.",
      },
    ],
    isActive: true,
  },
  {
    title: "Fairy Meadows Basecamp",
    slug: "fairy-meadows-basecamp",
    description:
      "A bucket-list trip with the best Nanga Parbat viewpoints, jeep transfers, and a cinematic camping feel.",
    types: ["adventure"],
    price: 164000,
    durationDays: 6,
    location: "Diamer",
    images: [
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1529634806980-85c3dd6d34ac?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1600&q=80",
    ],
    imageFolderKey: "tours/fairy-meadows-basecamp",
    itinerary: [
      {
        day: 1,
        title: "Drive to Raikot",
        description:
          "Travel up the Karakoram Highway and overnight near the base access point.",
      },
      {
        day: 2,
        title: "Jeep + hike to meadows",
        description:
          "Classic jeep track, short hike, and first full Nanga Parbat reveal.",
      },
      {
        day: 3,
        title: "Leisure in the meadows",
        description:
          "Sunrise photography, local tea, optional ridge walks, and campsite downtime.",
      },
      {
        day: 4,
        title: "Return to the valley",
        description:
          "Descend after breakfast and spend the night in a comfortable valley hotel.",
      },
    ],
    isActive: true,
  },
  {
    title: "Chitral & Kalash Culture Trail",
    slug: "chitral-kalash-culture-trail",
    description:
      "A culture-first itinerary with valley drives, Kalash heritage, and a distinctive off-the-beaten-path feel.",
    types: ["adventure", "corporate"],
    price: 172000,
    durationDays: 7,
    location: "Chitral",
    images: [
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1455621481073-d5bc1c40f1f9?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
    ],
    imageFolderKey: "tours/chitral-kalash-culture-trail",
    itinerary: [
      {
        day: 1,
        title: "Arrive Chitral",
        description:
          "Fly or drive in, then check in and prepare for the valley circuit.",
      },
      {
        day: 2,
        title: "Chitral town walk",
        description:
          "Local bazaar, fort views, and a guided introduction to the region.",
      },
      {
        day: 3,
        title: "Kalash Valley visit",
        description:
          "Cultural immersion with village visits, dress demonstrations, and storytelling.",
      },
      {
        day: 4,
        title: "Booni / upper valley drive",
        description:
          "Scenic road travel with river views, tea stops, and photography breaks.",
      },
      {
        day: 5,
        title: "Free day for markets",
        description:
          "Shopping, local food tasting, or a second village visit depending on the group.",
      },
    ],
    isActive: true,
  },
  {
    title: "Luxury Islamabad + Murree Starter",
    slug: "islamabad-murree-starter",
    description:
      "An easy sell for shorter trips: city comfort, Margalla Hills views, and Murree hill-station charm.",
    types: ["honeymoon", "corporate", "budget"],
    price: 69000,
    durationDays: 3,
    location: "Islamabad / Murree",
    images: [
      "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80",
    ],
    imageFolderKey: "tours/islamabad-murree-starter",
    itinerary: [
      {
        day: 1,
        title: "Islamabad arrival",
        description:
          "Hotel check-in, dinner in the capital, and a relaxed first-night schedule.",
      },
      {
        day: 2,
        title: "Murree hills",
        description:
          "Drive to Murree for viewpoints, shopping, and cool-weather sightseeing.",
      },
      {
        day: 3,
        title: "Return via Mall Road stop",
        description:
          "Breakfast, final photos, and an easy transfer back to Islamabad.",
      },
    ],
    isActive: true,
  },
];

export const seedSampleTours = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const destinations = await ctx.db.query("destinations").collect();
    const destinationBySlug = new Map(
      destinations.map((d) => [d.slug, d._id] as const),
    );
    const existing = await ctx.db.query("tours").take(1);
    if (existing.length > 0) return { inserted: 0, skipped: true as const };
    const now = Date.now();
    let inserted = 0;
    for (const t of sampleTours) {
      const destinationSlugs = TOUR_DESTINATION_MULTI_HINTS[t.slug] ?? [];
      const destinationIds = destinationSlugs
        .map((slug) => destinationBySlug.get(slug))
        .filter((id): id is NonNullable<typeof id> => Boolean(id));
      await ctx.db.insert("tours", {
        ...t,
        pricePkr: (t as any).pricePkr ?? t.price,
        // Approx seed-only conversion so USD isn't blank in UI.
        priceUsd:
          (t as any).priceUsd ??
          Math.max(1, Math.round(t.price / 280)),
        destinationIds: destinationIds.length > 0 ? destinationIds : undefined,
        destinationId: destinationIds[0],
        createdAt: now,
      });
      inserted++;
    }
    return { inserted, skipped: false as const };
  },
});
