import { RouteSegmentLoader } from "@/components/ui/PageLoadingSpinner";

export default function SiteLoading() {
  return <RouteSegmentLoader label="Loading…" variant="dark" />;
}
