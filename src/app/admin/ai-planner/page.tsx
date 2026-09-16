import { redirect } from "next/navigation";

/** Merged into Trip requests (same data); keep old links and bookmarks working. */
export default function AdminAiPlannerPage() {
  redirect("/admin/custom-itineraries");
}
