/** Draft returned by `api.tourPdfImport.parseTourPdf` for admin form pre-fill. */
export type TourPdfImportDraft = {
  title: string;
  slug: string;
  description: string;
  durationDays: number;
  location: string;
  types: string[];
  destinationSlugs: string[];
  provinceSlugs: string[];
  itinerary: Array<{ day: number; title: string; description: string }>;
  highlights: string[];
  included: string[];
  excluded: string[];
  tourTypeLabel?: string;
  maxPeople?: number;
  minAge?: number;
  timeSlots?: string[];
  ticketGroups?: Array<{ label: string; ageRange?: string }>;
  warnings: string[];
  enrichedByLlm: boolean;
};
