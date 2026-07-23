import { redirect } from "next/navigation";

// FAQs now live on the About page (merged into a single page).
export default function FaqsPage() {
  redirect("/about#faqs");
}
