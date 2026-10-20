/**
 * Plain-English labels for stored status values. The database keeps the
 * original words (so nothing breaks); only what the admin sees changes.
 */

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export const LEAD_STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Replied",
  converted: "Booked",
  closed: "Not interested",
};

export const VISA_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processed: "Invitation sent",
  rejected: "Rejected",
};

export const TRIP_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Quote sent",
  rejected: "Declined",
};

export const REVIEW_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

/** Label lookup that falls back to the stored word. */
export function labelFrom(map: Record<string, string>) {
  return (status: string) => map[status] ?? status;
}

/** "5 min ago", "3 h ago", "2 days ago" — `now` is passed in so callers control refresh. */
export function timeAgo(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "yesterday";
  if (d < 30) return `${d} days ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} ${mo === 1 ? "month" : "months"} ago`;
  const y = Math.floor(d / 365);
  return `${y} ${y === 1 ? "year" : "years"} ago`;
}
