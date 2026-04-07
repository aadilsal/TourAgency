import { RouteSegmentLoader } from "@/components/ui/PageLoadingSpinner";

export default function AdminLoading() {
  return <RouteSegmentLoader label="Loading admin…" variant="light" />;
}
