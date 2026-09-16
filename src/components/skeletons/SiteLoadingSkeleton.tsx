import { ListingPageSkeleton } from "@/components/skeletons/PageSkeletons";

/**
 * Default `loading.tsx` for public routes without a more specific skeleton:
 * a hero band + card grid, which is close to most index/content pages and
 * far lighter than the previous full-viewport home-hero placeholder.
 */
export function SiteLoadingSkeleton() {
  return <ListingPageSkeleton />;
}
