import type { ProvinceSlug } from "./provinces-data";

export type SiteType = "historical" | "cultural" | "natural" | "adventure";

export type SiteSeed = {
  slug: string;
  name: string;
  type: SiteType;
  summary: string;
  history: string;
  city?: string;
  era?: string;
  unesco?: boolean;
  heroExternalUrl?: string;
  destinationSlug?: string;
  featured: boolean;
  sortOrder: number;
};

export const SITES_BY_PROVINCE: Record<ProvinceSlug, SiteSeed[]> = {
  sindh: [
    {
      slug: "mohenjo-daro",
      name: "Mohenjo-daro",
      type: "historical",
      summary:
        "One of the largest cities of the Indus Valley Civilization — planned streets, Great Bath, and seals that rewrote South Asian prehistory.",
      history:
        "Mohenjo-daro flourished around 2500 BCE as a meticulously planned urban center on the Indus River. Archaeologists uncovered grid-pattern streets, advanced drainage, the iconic Great Bath, and artifacts suggesting long-distance trade. Abandoned by roughly 1900 BCE, the site remained buried until excavations in the 1920s revealed a civilization contemporary with Mesopotamia and Egypt. Walking the raised platforms today, visitors grasp how ancient urban life on the subcontinent was organized — a cornerstone of any Sindh heritage journey.",
      city: "Larkana",
      era: "Indus Valley",
      unesco: true,
      featured: true,
      sortOrder: 0,
    },
    {
      slug: "makli-necropolis",
      name: "Makli Necropolis",
      type: "historical",
      summary:
        "One of the world's largest funerary sites — half a million graves and monuments spanning Samma to Mughal eras near Thatta.",
      history:
        "Spread across rolling hills near Thatta, Makli is a UNESCO World Heritage site often called the world's largest necropolis. Tombs here span four centuries — from the Samma dynasty through the Arghun, Tarkhan, and Mughal periods. Stone carving, glazed tile, and calligraphic panels show how Sindh absorbed Persian and Central Asian aesthetics. The scale is staggering: royal mausoleums beside humble graves, all overlooking the plains toward the Indus delta.",
      city: "Thatta",
      era: "Medieval–Mughal",
      unesco: true,
      featured: true,
      sortOrder: 1,
    },
    {
      slug: "shah-jahan-mosque-thatta",
      name: "Shah Jahan Mosque, Thatta",
      type: "cultural",
      summary:
        "Mughal-era mosque famous for its 93 domes, geometric brickwork, and acoustics — a masterpiece of Sindhi-Mughal fusion.",
      history:
        "Commissioned by Emperor Shah Jahan and completed in 1647, this mosque is celebrated for its unique dome cluster and red-brick ornamentation rather than marble grandeur. The prayer hall's acoustics allow the imam's voice to carry without amplification. Combined with nearby Makli, Thatta forms one of Pakistan's most important heritage day trips from Karachi.",
      city: "Thatta",
      era: "Mughal",
      featured: true,
      sortOrder: 2,
    },
    {
      slug: "ranikot-fort",
      name: "Ranikot Fort",
      type: "historical",
      summary:
        "The 'Great Wall of Sindh' — a 32 km circumference fort in the Kirthar range, among the largest in the world.",
      history:
        "Ranikot's origins remain debated, but its massive ramparts snake across desert ridges in a near-perfect ellipse. Inner structures like Miri and Mohan gates suggest layers of Talpur and earlier construction. Remote and atmospheric, it rewards travelers who want fortress archaeology beyond the usual tourist circuit.",
      city: "Jamshoro",
      era: "Talpur",
      featured: true,
      sortOrder: 3,
    },
    {
      slug: "quaid-mausoleum",
      name: "Mazar-e-Quaid",
      type: "cultural",
      summary:
        "Karachi's white marble mausoleum of Muhammad Ali Jinnah — modern national monument and peaceful urban oasis.",
      history:
        "Designed by architect Yahya Merchant and completed in 1970, the mausoleum houses the founder of Pakistan and other leaders. Its clean modernist lines contrast with older Sindhi heritage sites while anchoring Karachi's identity as the nation's first capital and largest port city.",
      city: "Karachi",
      era: "Modern",
      featured: false,
      sortOrder: 4,
    },
    {
      slug: "clifton-seafront",
      name: "Clifton & Seafront",
      type: "cultural",
      summary:
        "Karachi's Arabian Sea promenade — food streets, historic churches nearby, and sunset views over the port city.",
      history:
        "Clifton has evolved from a colonial-era seaside suburb into Karachi's social heart. Nearby landmarks include colonial architecture, Abdullah Shah Ghazi shrine, and access to boat trips. It bookends heritage touring with contemporary urban culture.",
      city: "Karachi",
      featured: false,
      sortOrder: 5,
    },
    {
      slug: "bhambore",
      name: "Bhambore (Banbhore)",
      type: "historical",
      summary:
        "Ancient port ruins linked to the legend of Sassi-Punnu and early Islamic arrival on the Sindh coast.",
      history:
        "Excavations at Bhambore reveal occupation from the 1st century BCE through the early Islamic period. Some traditions associate it with Debal, where Muhammad bin Qasim landed in 711 CE. Pottery, mosques, and residential layers make it a compact archaeological stop between Karachi and Thatta.",
      city: "Thatta",
      era: "Ancient–Early Islamic",
      featured: false,
      sortOrder: 6,
    },
    {
      slug: "kot-diji-fort",
      name: "Kot Diji Fort",
      type: "historical",
      summary:
        "18th-century fort overlooking the Indus near Khairpur — dramatic ramparts above pre-Harappan Kot Diji archaeology.",
      history:
        "Built by the Talpur Mirs, Kot Diji Fort commands a bluff near the Kot Diji archaeological site (predating Mohenjo-daro). The pairing of ancient mound and later fortress illustrates Sindh's layered history along the Indus corridor.",
      city: "Khairpur",
      era: "Talpur",
      featured: false,
      sortOrder: 7,
    },
    {
      slug: "lal-shahbaz-qalandar",
      name: "Lal Shahbaz Qalandar Shrine",
      type: "cultural",
      summary:
        "Sehwan's iconic Sufi shrine — dhamaal, qawwali, and pilgrimage culture at one of Sindh's holiest sites.",
      history:
        "Dedicated to the 13th-century Sufi saint Lal Shahbaz Qalandar, the shrine draws millions during Urs celebrations. The site's spiritual energy, music, and charitable traditions embody Sindh's deep Sufi heritage beyond brick-and-mortar monuments.",
      city: "Sehwan",
      era: "Sufi",
      featured: false,
      sortOrder: 8,
    },
    {
      slug: "keenjhar-lake",
      name: "Keenjhar Lake",
      type: "natural",
      summary:
        "Sindh's largest freshwater lake — birdlife, boat rides, and Shah Abdul Latif's folklore tied to Noori Jam Tamachi.",
      history:
        "Keenjhar (Kalri Lake) feeds Karachi's water supply and supports migratory birds. Folklore immortalized by Shah Abdul Latif links the lake to the romance of Noori Jam Tamachi. A gentle nature counterpoint to archaeological touring.",
      city: "Thatta",
      featured: false,
      sortOrder: 9,
    },
    {
      slug: "chaukhandi-tombs",
      name: "Chaukhandi Tombs",
      type: "historical",
      summary:
        "Sandstone funerary slabs with unique carvings — transitional style between Sindh and Balochistan traditions.",
      history:
        "These 15th–18th century tombs feature elaborate sandstone relief work depicting riders, jewelry, and weapons. Located east of Karachi, they are a compact introduction to Sindhi funerary art before visiting Makli at scale.",
      city: "Karachi",
      era: "Medieval",
      featured: false,
      sortOrder: 10,
    },
    {
      slug: "hyderabad-pacco-qillo",
      name: "Pacco Qillo, Hyderabad",
      type: "historical",
      summary:
        "Kalhora-era fort in Hyderabad — gateway to interior Sindh and the Sindhi capital's old quarter.",
      history:
        "Pacco Qillo (Pakka Qila) was built during the Kalhora dynasty and later used by Talpur rulers. Though partially encroached, it remains symbolic of Hyderabad's role as a riverine trading city between Karachi and upper Sindh.",
      city: "Hyderabad",
      era: "Kalhora",
      featured: false,
      sortOrder: 11,
    },
  ],
  balochistan: [
    {
      slug: "hingol-national-park",
      name: "Hingol National Park",
      type: "natural",
      summary:
        "Surreal coastal desert — mud volcanoes, Princess of Hope rock formation, and Hinglaj Mata pilgrimage routes.",
      history:
        "Hingol spans the Makran coast where desert meets Arabian Sea. Mud volcanoes bubble near the shore; wind-sculpted formations like the Princess of Hope draw photographers. The park also holds spiritual significance for Hinglaj Mata pilgrims. Remote camping and jeep access make it one of Pakistan's most otherworldly landscapes.",
      city: "Makran",
      featured: true,
      sortOrder: 0,
    },
    {
      slug: "ziarat-juniper-forest",
      name: "Ziarat Juniper Forest",
      type: "natural",
      summary:
        "Ancient juniper woodland at 2,500m — among the world's oldest juniper ecosystems and Quaid's final residency.",
      history:
        "Ziarat's juniper forest includes trees over a millennium old. Cool summers drew British officials and later Muhammad Ali Jinnah, whose residency is preserved as a museum. The combination of colonial history and rare highland ecology makes Ziarat Balochistan's gentlest introduction.",
      city: "Ziarat",
      featured: true,
      sortOrder: 1,
    },
    {
      slug: "quetta-bazaars",
      name: "Quetta Bazaars",
      type: "cultural",
      summary:
        "Frontier trading city — Kandahari carpets, dried fruits, and the historic Kandahari Bazaar atmosphere.",
      history:
        "Quetta sits at the crossroads of Afghanistan, Iran, and interior Pakistan. Its bazaars reflect Pashtun, Baloch, and Hazara communities. The city is a practical base for Ziarat, Hanna Lake, and highland excursions while offering its own urban heritage.",
      city: "Quetta",
      featured: true,
      sortOrder: 2,
    },
    {
      slug: "gwadar-coast",
      name: "Gwadar Coast",
      type: "adventure",
      summary:
        "Hammerhead peninsula, virgin beaches, and fishing harbors on the Arabian Sea's western rim.",
      history:
        "Gwadar's natural hammerhead spit and turquoise coves predate modern port development. Traditional boat-building and fishing communities offer cultural context. Sunset viewpoints and coastal drives define the Makran experience.",
      city: "Gwadar",
      featured: true,
      sortOrder: 3,
    },
    {
      slug: "pir-ghaib",
      name: "Pir Ghaib Waterfalls",
      type: "natural",
      summary:
        "Hidden oasis waterfalls in the Bolan Pass region — palm groves amid stark canyon walls.",
      history:
        "Pir Ghaib (the invisible saint) is a seasonal waterfall complex reachable by jeep through dramatic gorges. Local legend attributes the site to a saint who vanished into the rocks. It showcases Balochistan's hidden green pockets.",
      city: "Bolan",
      featured: false,
      sortOrder: 4,
    },
    {
      slug: "hanna-urak",
      name: "Hanna Lake & Urak Valley",
      type: "natural",
      summary:
        "Reservoir and orchard valley near Quetta — easy day trip with picnic culture and mountain views.",
      history:
        "Hanna Lake was built during the British era as a recreation spot. Nearby Urak Valley supplies Quetta's fruit markets. Together they offer accessible highland scenery without multi-day desert commitments.",
      city: "Quetta",
      featured: false,
      sortOrder: 5,
    },
    {
      slug: "mehrgarh",
      name: "Mehrgarh",
      type: "historical",
      summary:
        "Neolithic archaeological site near Bolan Pass — evidence of early farming and pottery predating the Indus cities.",
      history:
        "Excavations at Mehrgarh revealed continuous occupation from roughly 7000 BCE, including early dentistry and crop cultivation. Though not as visually dramatic as Mohenjo-daro, it is scientifically crucial to understanding how Indus civilization emerged.",
      city: "Kachi",
      era: "Neolithic",
      featured: false,
      sortOrder: 6,
    },
    {
      slug: "khuzdar-fort",
      name: "Khuzdar Fort",
      type: "historical",
      summary:
        "Historic hilltop fort commanding routes through central Balochistan — gateway to interior plateaus.",
      history:
        "Khuzdar has long guarded trade routes between Sindh and Quetta. The fort and surrounding town reflect Baloch tribal administration and frontier geography.",
      city: "Khuzdar",
      featured: false,
      sortOrder: 7,
    },
    {
      slug: "astola-island",
      name: "Astola Island",
      type: "adventure",
      summary:
        "Pakistan's largest offshore island — cliff camping, turtle nesting, and crystal-clear diving potential.",
      history:
        "Also called Jezira Haft Talar, Astola lies south of Pasni. Its isolation preserves seabird colonies and endangered turtle beaches. Boat access and camping make it an adventure capstone to Makran coastal trips.",
      city: "Pasni",
      featured: false,
      sortOrder: 8,
    },
    {
      slug: "moola-chotok",
      name: "Moola Chotok",
      type: "natural",
      summary:
        "Canyon waterfalls in Khuzdar district — turquoise pools amid red rock gorges.",
      history:
        "Moola Chotok gained fame for its tiered waterfalls inside a narrow canyon. Seasonal flow varies, but the geology and remote setting exemplify Balochistan's surprise landscapes.",
      city: "Khuzdar",
      featured: false,
      sortOrder: 9,
    },
  ],
  punjab: [
    {
      slug: "badshahi-mosque",
      name: "Badshahi Mosque",
      type: "cultural",
      summary:
        "Aurangzeb's 1673 mosque — Lahore's red-sandstone masterpiece facing the Lahore Fort across Hazuri Bagh.",
      history:
        "The Badshahi Mosque was the world's largest mosque for over 300 years. Its vast courtyard, marble inlay, and minarets define Lahore's skyline. Standing in Hazuri Bagh between fort and mosque, visitors experience the Mughal ceremonial heart of Punjab.",
      city: "Lahore",
      era: "Mughal",
      destinationSlug: "lahore",
      featured: true,
      sortOrder: 0,
    },
    {
      slug: "lahore-fort",
      name: "Lahore Fort",
      type: "historical",
      summary:
        "UNESCO fort complex — Sheesh Mahal, Alamgiri Gate, and layers from Ghaznavid to Sikh and British eras.",
      history:
        "The Lahore Fort's origins reach the 11th century, but its zenith came under Akbar, Jahangir, and Shah Jahan. The Sheesh Mahal's mirror work, Naulakha Pavilion, and Picture Wall showcase peak Mughal artistry. Sikh and British additions tell Punjab's post-Mughal story.",
      city: "Lahore",
      era: "Mughal",
      unesco: true,
      destinationSlug: "lahore",
      featured: true,
      sortOrder: 1,
    },
    {
      slug: "shalimar-gardens",
      name: "Shalimar Gardens",
      type: "cultural",
      summary:
        "Mughal charbagh gardens — terraced pools, marble pavilions, and UNESCO-listed landscape design.",
      history:
        "Built by Shah Jahan in 1642, Shalimar Gardens exemplify Persian-inspired garden geometry adapted to Punjab's climate. Fountains once flowed without pumps using gradient engineering. Evening visits capture the romance of Mughal leisure culture.",
      city: "Lahore",
      era: "Mughal",
      unesco: true,
      destinationSlug: "lahore",
      featured: true,
      sortOrder: 2,
    },
    {
      slug: "multan-shrines",
      name: "Multan Sufi Shrines",
      type: "cultural",
      summary:
        "City of saints — blue-tiled tombs of Bahauddin Zakariya, Shah Rukn-e-Alam, and Shams Tabrizi.",
      history:
        "Multan's skyline is defined by shrine domes clad in turquoise faience. The city attracted Sufi orders for centuries, becoming a pilgrimage center on the Indus. Craft bazaars and fort ruins complement the spiritual architecture.",
      city: "Multan",
      era: "Sufi",
      destinationSlug: "multan",
      featured: true,
      sortOrder: 3,
    },
    {
      slug: "harappa",
      name: "Harappa",
      type: "historical",
      summary:
        "Namesake of the Harappan civilization — granaries, cemetery H, and urban planning parallel to Mohenjo-daro.",
      history:
        "Harappa was among the first Indus sites excavated in the 1920s, giving the civilization its name. Though erosion damaged structures, surviving mounds and the site museum explain craft specialization, weights, and trade networks that linked Punjab to Mesopotamia.",
      city: "Sahiwal",
      era: "Indus Valley",
      featured: true,
      sortOrder: 4,
    },
    {
      slug: "rohtas-fort",
      name: "Rohtas Fort",
      type: "historical",
      summary:
        "UNESCO fortress built by Sher Shah Suri — massive gates and strategic Jhelum gorge location.",
      history:
        "Rohtas was constructed in 1541 to suppress Gakhar tribes and secure the Sur dynasty's Punjab flank. Its 4 km walls, baolis, and Haveli Man Singh show military architecture at monumental scale — a contrast to Mughal elegance in Lahore.",
      city: "Jhelum",
      era: "Sur dynasty",
      unesco: true,
      featured: false,
      sortOrder: 5,
    },
    {
      slug: "walled-city-lahore",
      name: "Walled City of Lahore",
      type: "cultural",
      summary:
        "Delhi Gate to Food Street — havelis, mosques, and living bazaar culture inside the old city.",
      history:
        "The Walled City preserves Mughal-era urban fabric: Masjid Wazir Khan's tilework, Shahi Hammam, and narrow lanes of artisans. Restoration projects and food streets have revived tourism while communities continue centuries-old trades.",
      city: "Lahore",
      destinationSlug: "lahore",
      featured: false,
      sortOrder: 6,
    },
    {
      slug: "noor-mahal",
      name: "Noor Mahal",
      type: "historical",
      summary:
        "Italianate palace of Bahawalpur nawabs — chandeliers, Corinthian columns, and princely state grandeur.",
      history:
        "Built in 1872 for Nawab Sadiq Muhammad Khan IV, Noor Mahal blends European neoclassical design with subcontinental court life. Bahawalpur's princely heritage offers a different Punjab narrative from Mughal Lahore.",
      city: "Bahawalpur",
      era: "Princely",
      featured: false,
      sortOrder: 7,
    },
    {
      slug: "derawar-fort",
      name: "Derawar Fort",
      type: "historical",
      summary:
        "Cholistan Desert fortress — 40 bastions visible for miles across the sand sea.",
      history:
        "Derawar's current structure dates to the 18th century Nawabs of Bahawalpur, though the site is far older. It anchors Cholistan jeep safaris and the annual Jeep Rally, merging desert adventure with Rajput-era military architecture.",
      city: "Bahawalpur",
      featured: false,
      sortOrder: 8,
    },
    {
      slug: "katas-raj",
      name: "Katas Raj Temples",
      type: "cultural",
      summary:
        "Hindu temple complex around a sacred pond — pilgrimage site with legend linking to the Mahabharata.",
      history:
        "Katas Raj's Satghara temples surround a spring-fed pool revered in Hindu tradition. Restoration has preserved sandstone shrines that testify to Punjab's multi-faith past before Partition.",
      city: "Chakwal",
      era: "Hindu",
      featured: false,
      sortOrder: 9,
    },
    {
      slug: "hiran-minar",
      name: "Hiran Minar",
      type: "historical",
      summary:
        "Jahangir-era hunting pavilion near Sheikhupura — minaret memorial to a pet antelope.",
      history:
        "Emperor Jahangir built Hiran Minar in 1606 in memory of his antelope Mansraj. The baradari sits in a large tank, reflecting Mughal hunting culture and architectural whimsy outside major cities.",
      city: "Sheikhupura",
      era: "Mughal",
      featured: false,
      sortOrder: 10,
    },
    {
      slug: "wahga-border",
      name: "Wagah Border Ceremony",
      type: "cultural",
      summary:
        "Daily flag-lowering parade at the India-Pakistan border — patriotic spectacle minutes from Lahore.",
      history:
        "The Wagah-Attari ceremony has evolved into choreographed military drill watched by thousands. While contemporary politics frame the event, its location on the Grand Trunk Road heritage corridor connects to Punjab's partition history.",
      city: "Lahore",
      featured: false,
      sortOrder: 11,
    },
  ],
  islamabad: [
    {
      slug: "taxila",
      name: "Taxila UNESCO Sites",
      type: "historical",
      summary:
        "Gandhara Buddhist capital — Dharmarajika stupa, Jaulian monastery, and museum masterpieces.",
      history:
        "Taxila flourished from the 6th century BCE through the 5th century CE as a center of learning and Gandhara art. Alexander, Ashoka, and Kushan rulers left layers of cities and monasteries. The museum's Fasting Buddha and stone reliefs are among South Asia's finest archaeological treasures.",
      city: "Taxila",
      era: "Gandhara",
      unesco: true,
      destinationSlug: "taxila",
      featured: true,
      sortOrder: 0,
    },
    {
      slug: "faisal-mosque",
      name: "Faisal Mosque",
      type: "cultural",
      summary:
        "National mosque against the Margalla foothills — modern tent-inspired design by Vedat Dalokay.",
      history:
        "Completed in 1986, Faisal Mosque's angular white marble forms broke from traditional dome aesthetics. Funded by Saudi Arabia, it seats 100,000 and symbolizes Pakistan's Islamic identity alongside its ancient Buddhist heritage at Taxila.",
      city: "Islamabad",
      era: "Modern",
      featured: true,
      sortOrder: 1,
    },
    {
      slug: "lok-virsa",
      name: "Lok Virsa Museum",
      type: "cultural",
      summary:
        "Living heritage museum — regional crafts, folk architecture, and cultural festivals.",
      history:
        "Lok Virsa documents Pakistan's ethnographic diversity through pavilion replicas, textile collections, and artisan demonstrations. It contextualizes provinces visitors will explore deeper on dedicated guide pages.",
      city: "Islamabad",
      featured: true,
      sortOrder: 2,
    },
    {
      slug: "margalla-hills",
      name: "Margalla Hills Trails",
      type: "natural",
      summary:
        "Forested ridges above Islamabad — Trail 3, Trail 5, and viewpoints over the capital.",
      history:
        "The Margalla Hills National Park protects leopard habitat and hiking routes used daily by Islamabad residents. Trails range from family walks to steep ridge climbs with panoramic city views.",
      city: "Islamabad",
      featured: true,
      sortOrder: 3,
    },
    {
      slug: "pakistan-monument",
      name: "Pakistan Monument",
      type: "cultural",
      summary:
        "Petalled national monument and museum — unity symbol with views toward Rawalpindi.",
      history:
        "Designed as blooming flower petals, the 2007 monument represents Pakistan's four provinces and territories. The adjacent museum narrates independence and cultural diversity.",
      city: "Islamabad",
      era: "Modern",
      featured: false,
      sortOrder: 4,
    },
    {
      slug: "rawat-fort",
      name: "Rawat Fort",
      type: "historical",
      summary:
        "Early Muslim fort on the GT Road — tomb of Sultan Sarang Khan and medieval masonry.",
      history:
        "Rawat Fort dates to the early 16th century, built to defend the Potohar plateau. Its location on ancient trade routes links Islamabad's hinterland to Punjab and Kashmir corridors.",
      city: "Rawalpindi",
      featured: false,
      sortOrder: 5,
    },
    {
      slug: "saint-john-cathedral",
      name: "St. John's Cathedral, Murree",
      type: "cultural",
      summary:
        "Hill-station colonial church — cedar architecture in Pakistan's oldest resort town.",
      history:
        "Murree's colonial churches and Mall Road architecture reflect British-era hill station culture. Combined with Patriata chairlift and pine forests, it offers heritage beyond archaeology.",
      city: "Murree",
      era: "Colonial",
      featured: false,
      sortOrder: 6,
    },
    {
      slug: "sirkap-taxila",
      name: "Sirkap City Ruins",
      type: "historical",
      summary:
        "Greek-influenced urban grid at Taxila — Sun Temple and double-headed eagle stupa.",
      history:
        "Sirkap was laid out after Bactrian Greek influence reached Gandhara. Its straight streets, temple foundations, and stupa platforms show Hellenistic urban planning merged with Buddhist devotion.",
      city: "Taxila",
      era: "Gandhara",
      destinationSlug: "taxila",
      featured: false,
      sortOrder: 7,
    },
  ],
  kpk: [
    {
      slug: "qissa-khwani",
      name: "Qissa Khwani Bazaar",
      type: "cultural",
      summary:
        "Peshawar's 'Storytellers' Bazaar' — chai culture, chapli kebab, and frontier trading history.",
      history:
        "Qissa Khwani has been a caravanserai hub for centuries where traders shared tales over tea. Nearby are mosques, brass shops, and the historic Sethi houses. It embodies KPK's urban heritage distinct from mountain valleys.",
      city: "Peshawar",
      featured: true,
      sortOrder: 0,
    },
    {
      slug: "swat-museums",
      name: "Swat Buddhist Sites",
      type: "historical",
      summary:
        "Butkara, Udegram, and Swat Museum — Gandhara heritage in the 'Switzerland of Pakistan'.",
      history:
        "Swat Valley holds hundreds of Buddhist sites from when it was a major Gandhara center. Stupas at Butkara and monastery ruins at Udegram pair with the Swat Museum's relocated sculptures. Heritage touring here naturally combines with alpine scenery.",
      city: "Swat",
      era: "Gandhara",
      destinationSlug: "swat",
      featured: true,
      sortOrder: 1,
    },
    {
      slug: "kalash-valleys",
      name: "Kalash Valleys",
      type: "cultural",
      summary:
        "Bumburet, Rumbur, and Birir — indigenous Kalash culture, festivals, and wooden temples.",
      history:
        "The Kalash people maintain distinct language, dress, and seasonal festivals (Joshi, Uchau) in three valleys near Chitral. Their animist traditions and woodworking represent living heritage protected by community tourism guidelines.",
      city: "Chitral",
      destinationSlug: "chitral",
      featured: true,
      sortOrder: 2,
    },
    {
      slug: "chitral-fort",
      name: "Chitral Fort & Shahi Mosque",
      type: "historical",
      summary:
        "Mehtar's fort above the Chitral River — polo grounds and mountain kingdom history.",
      history:
        "The Chitral Fort was seat of the Mehtar rulers who balanced British, Afghan, and internal pressures. Polo — possibly originating here — and the ornate Shahi Mosque anchor town heritage before valley excursions.",
      city: "Chitral",
      destinationSlug: "chitral",
      featured: true,
      sortOrder: 3,
    },
    {
      slug: "malam-jabba",
      name: "Malam Jabba",
      type: "adventure",
      summary:
        "Swat's ski resort — winter sports and summer meadows with Hindu Shahi archaeological traces.",
      history:
        "Malam Jabba combines modern skiing infrastructure with ancient site remnants nearby. It represents KPK's adventure layer atop cultural touring in Swat.",
      city: "Swat",
      destinationSlug: "swat",
      featured: false,
      sortOrder: 4,
    },
    {
      slug: "kaghan-valley",
      name: "Kaghan & Naran",
      type: "natural",
      summary:
        "Alpine corridor to Lake Saif-ul-Malook — folklore, glaciers, and Babusar Pass access.",
      history:
        "Kaghan Valley's lakes and meadows feature in Pashto and Punjabi folklore, especially the legend of Saif-ul-Malook. The corridor connects Babusar Pass to northern Punjab and Gilgit routes.",
      city: "Naran",
      destinationSlug: "naran",
      featured: false,
      sortOrder: 5,
    },
    {
      slug: "takht-bhai",
      name: "Takht-i-Bahi",
      type: "historical",
      summary:
        "UNESCO monastery on a hilltop near Mardan — among the best-preserved Gandhara complexes.",
      history:
        "Founded in the 1st century CE, Takht-i-Bahi's terraced courts and meditation cells survived largely intact. Its elevation offers views over Mardan plain — essential KPK heritage beyond Swat.",
      city: "Mardan",
      era: "Gandhara",
      unesco: true,
      featured: false,
      sortOrder: 6,
    },
    {
      slug: "mahodand-lake",
      name: "Mahodand Lake",
      type: "natural",
      summary:
        "Trout-filled alpine lake in upper Swat — jeep track adventure and meadow camping.",
      history:
        "Mahodand sits at 9,000 feet surrounded by pine forests. Seasonal trout fishing and meadow camps make it a natural extension after Swat heritage sites.",
      city: "Swat",
      featured: false,
      sortOrder: 7,
    },
    {
      slug: "peshawar-museum",
      name: "Peshawar Museum",
      type: "cultural",
      summary:
        "Gandhara sculpture collection — one of the world's largest Buddhist art repositories.",
      history:
        "The museum houses friezes, Buddhas, and relic caskets from across KPK archaeological sites. Visiting before field sites provides essential context for Gandhara art history.",
      city: "Peshawar",
      era: "Gandhara",
      featured: false,
      sortOrder: 8,
    },
    {
      slug: "kumrat-valley",
      name: "Kumrat Valley",
      type: "adventure",
      summary:
        "Upper Dir pine forests, wooden bridges, and Jahaz Banda meadows — emerging eco-tourism.",
      history:
        "Kumrat gained popularity for untouched forests and the Panjkora River. Wooden motels and camping culture are developing carefully — an adventure complement to southern KPK's archaeological circuit.",
      city: "Dir",
      featured: false,
      sortOrder: 9,
    },
  ],
  "gilgit-baltistan": [
    {
      slug: "baltit-fort",
      name: "Baltit Fort",
      type: "historical",
      summary:
        "700-year-old fort above Karimabad — Tibetan-influenced architecture and Hunza royal history.",
      history:
        "Baltit Fort was seat of the Mirs of Hunza until 1945. Restored by the Aga Khan Trust, its timber and stone tiers document trade with Xinjiang and Kashmir. Sunrise views over Rakaposhi make it northern heritage's flagship site.",
      city: "Hunza",
      destinationSlug: "hunza",
      featured: true,
      sortOrder: 0,
    },
    {
      slug: "altit-fort",
      name: "Altit Fort",
      type: "historical",
      summary:
        "Older than Baltit — cliff-edge fort with royal garden and 900 years of Hunza continuity.",
      history:
        "Altit Fort's foundations may exceed a millennium. The royal garden and watch towers illustrate how Hunza controlled Silk Route tolls. Cultural performances now fund community preservation.",
      city: "Hunza",
      destinationSlug: "hunza",
      featured: true,
      sortOrder: 1,
    },
    {
      slug: "shigar-fort",
      name: "Shigar Fort",
      type: "historical",
      summary:
        "Restored Amacha dynasty palace — heritage hotel and museum in the gateway to K2 trails.",
      history:
        "Shigar Fort was converted into a boutique heritage residence while preserving 400-year-old wood carvings. The town is the last major settlement before trekkers head toward Askole and the Baltoro Glacier.",
      city: "Skardu",
      destinationSlug: "skardu",
      featured: true,
      sortOrder: 2,
    },
    {
      slug: "deosai-plains",
      name: "Deosai National Park",
      type: "natural",
      summary:
        "Second-highest plateau — brown bears, wildflowers, and Sheosar Lake at 4,100m.",
      history:
        "Deosai ('Land of Giants') is accessible briefly each summer when roads clear. Its biodiversity and sheer altitude contrast with valley forts — a natural heritage capstone linking Skardu and Astore.",
      city: "Skardu",
      featured: true,
      sortOrder: 3,
    },
    {
      slug: "attabad-lake",
      name: "Attabad Lake",
      type: "natural",
      summary:
        "Turquoise lake born from 2010 landslide — boat tunnels and dramatic Karakoram backdrop.",
      history:
        "The landslide blocked the Hunza River, displacing communities but creating one of Pakistan's most photographed lakes. Boat rides through tunnel sections symbolize resilience and transformed geography.",
      city: "Hunza",
      destinationSlug: "hunza",
      featured: false,
      sortOrder: 4,
    },
    {
      slug: "khunjerab-pass",
      name: "Khunjerab Pass",
      type: "adventure",
      summary:
        "4,693m border crossing on the Karakoram Highway — highest paved international border.",
      history:
        "Khunjerab links Pakistan with China's Xinjiang via the KKH. Marco Polo sheep habitat and snowbound landscapes define the adventure endpoint of many GB road trips.",
      city: "Hunza",
      featured: false,
      sortOrder: 5,
    },
    {
      slug: "kharpocho-fort",
      name: "Kharpocho Fort",
      type: "historical",
      summary:
        "Skardu hilltop fort overlooking the Indus and Shigar confluence — 16th-century Balti stronghold.",
      history:
        "Maqpon dynasty rulers built Kharpocho to control Indus valley trade. Sunset from the ramparts frames Skardu town and the approach to Cold Desert.",
      city: "Skardu",
      destinationSlug: "skardu",
      featured: false,
      sortOrder: 6,
    },
    {
      slug: "khaplu-palace",
      name: "Khaplu Palace",
      type: "historical",
      summary:
        "Yabgo dynasty heritage residence — Tibetan-Balti architecture in Ghanche district.",
      history:
        "Restored by heritage trusts, Khaplu Palace documents Balti kings who ruled east of Skardu. Wood balconies and apricot orchards offer a quieter cultural counterpoint to Hunza crowds.",
      city: "Khaplu",
      featured: false,
      sortOrder: 7,
    },
    {
      slug: "fairy-meadows",
      name: "Fairy Meadows",
      type: "adventure",
      summary:
        "Nanga Parbat base camp meadow — jeep track, hike, and iconic mountain views.",
      history:
        "Named by German climbers, Fairy Meadows offers the closest comfortable viewpoint of Nanga Parbat's Rupal Face. The journey via Raikot Bridge and jeep track is itself an adventure ritual.",
      city: "Diamer",
      featured: false,
      sortOrder: 8,
    },
    {
      slug: "upper-kachura",
      name: "Upper Kachura Lake",
      type: "natural",
      summary:
        "Hidden glacial lake near Skardu — cedar-fringed clarity fewer crowds than Lower Kachura.",
      history:
        "Upper Kachura requires a short hike from the road, preserving its calm. Combined with Shigar and Deosai, it rounds out Skardu nature heritage.",
      city: "Skardu",
      destinationSlug: "skardu",
      featured: false,
      sortOrder: 9,
    },
  ],
  "azad-kashmir": [
    {
      slug: "neelum-valley",
      name: "Neelum Valley",
      type: "natural",
      summary:
        "120km pine valley along the Neelum River — Keran, Sharda, and Taobat frontier scenery.",
      history:
        "Neelum Valley parallels the Line of Control, with villages like Keran offering cross-valley views. Sharda's ancient university ruins and forest drives define AJK's primary tourism corridor.",
      city: "Neelum",
      featured: true,
      sortOrder: 0,
    },
    {
      slug: "muzaffarabad-fort",
      name: "Red Fort, Muzaffarabad",
      type: "historical",
      summary:
        "17th-century fort at the Jhelum-Neelum confluence — seat of AJK capital heritage.",
      history:
        "The Red Fort (Chak Fort) overlooks Muzaffarabad where two rivers meet. Rebuilt across centuries, it anchors the capital's history before travelers head into Neelum or Jhelum valley branches.",
      city: "Muzaffarabad",
      featured: true,
      sortOrder: 1,
    },
    {
      slug: "pir-chinasi",
      name: "Pir Chinasi",
      type: "natural",
      summary:
        "Ridge shrine with 360° views — pine forests and Himalayan panoramas above Muzaffarabad.",
      history:
        "Pir Chinasi's shrine and viewpoint sit at 2,900m, accessible by jeep year-round in fair weather. Sunrise and cloud inversions make it AJK's signature panorama.",
      city: "Muzaffarabad",
      featured: true,
      sortOrder: 2,
    },
    {
      slug: "sharda-peeth",
      name: "Sharda Peeth Ruins",
      type: "historical",
      summary:
        "Ancient Hindu-Buddhist learning center ruins in upper Neelum — archaeological serenity.",
      history:
        "Sharda was a major temple university referenced in Kashmiri chronicles. Ruins near the Neelum River evoke a time when the valley was a scholarly crossroads between Gandhara and Kashmir courts.",
      city: "Neelum",
      featured: true,
      sortOrder: 3,
    },
    {
      slug: "rawalakot",
      name: "Rawalakot & Banjosa Lake",
      type: "natural",
      summary:
        "Poonch district hill station — Banjosa's artificial lake amid pine-covered hills.",
      history:
        "Rawalakot serves Poonch valley travelers with cooler climate and Banjosa Lake picnics. Less crowded than Neelum, it offers family-friendly nature heritage.",
      city: "Rawalakot",
      featured: false,
      sortOrder: 4,
    },
    {
      slug: "leepa-valley",
      name: "Leepa Valley",
      type: "cultural",
      summary:
        "Terraced villages and walnut orchards — distinctive Kashmiri architecture in a remote valley.",
      history:
        "Leepa's wooden houses with double-skin roofs reflect cross-LOC Kashmiri building traditions. Seasonal access makes it a cultural deep-cut for repeat AJK visitors.",
      city: "Hattian",
      featured: false,
      sortOrder: 5,
    },
    {
      slug: "mangla-fort",
      name: "Mangla Fort",
      type: "historical",
      summary:
        "Historic fort near Mangla Dam — ancient site overlooking modern engineering on the Jhelum.",
      history:
        "Mangla's fort predates the dam that reshaped the landscape in the 1960s. The juxtaposition illustrates how AJK balances hydropower development with heritage preservation.",
      city: "Mirpur",
      featured: false,
      sortOrder: 6,
    },
    {
      slug: "tolipir",
      name: "Tolipir National Park",
      type: "adventure",
      summary:
        "High meadow plateau above Rawalakot — summer grazing culture and ridge hikes.",
      history:
        "Tolipir's expansive meadows at 2,600m host seasonal herders. Clear days reveal peaks across Kashmir — a hiking complement to Neelum's river culture.",
      city: "Rawalakot",
      featured: false,
      sortOrder: 7,
    },
  ],
};

export function getSitesForProvince(slug: ProvinceSlug): SiteSeed[] {
  return SITES_BY_PROVINCE[slug] ?? [];
}

export function getFeaturedSitesForProvince(slug: ProvinceSlug, limit = 6): SiteSeed[] {
  return getSitesForProvince(slug)
    .filter((s) => s.featured)
    .slice(0, limit);
}

export function countSitesForProvince(slug: ProvinceSlug): number {
  return getSitesForProvince(slug).length;
}
