export type PlannerPlan = {
  recommendedSlugs: string[];
  itinerary: Array<{ day: number; title: string; detail: string }>;
  proposesCustomPlan: boolean;
  customPlanDraft: string;
};

function slugToLabel(slug: string) {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function formatPlannerReply(reply: string, plan: PlannerPlan) {
  const parts: string[] = [];
  const mainReply = reply.trim();
  if (mainReply) {
    parts.push(mainReply);
  }

  if (plan.recommendedSlugs.length > 0) {
    parts.push(
      [
        "Matching tours",
        ...plan.recommendedSlugs.map((slug) => `- ${slugToLabel(slug)}`),
      ].join("\n"),
    );
  }

  if (plan.itinerary.length > 0) {
    parts.push(
      [
        "Suggested itinerary",
        ...plan.itinerary.map((day) =>
          `- Day ${day.day}: ${day.title} — ${day.detail}`,
        ),
      ].join("\n"),
    );
  }

  if (plan.proposesCustomPlan && plan.customPlanDraft.trim()) {
    parts.push(
      ["Custom route draft", plan.customPlanDraft.trim()].join("\n"),
    );
  }

  return parts.join("\n\n");
}