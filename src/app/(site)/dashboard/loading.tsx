import { RouteSegmentLoader } from "@/components/ui/PageLoadingSpinner";

export default function DashboardLoading() {
  return <RouteSegmentLoader label="Loading dashboard…" variant="dark" />;
}
