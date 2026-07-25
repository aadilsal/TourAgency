import { cronJobs } from "convex/server";
import { internal } from "./_generated/api.js";

const crons = cronJobs();

// Refresh cached Google reviews daily (no-op until GOOGLE_PLACES_API_KEY is
// configured — the Place ID auto-resolves from the business name/address).
crons.daily(
  "refresh google reviews",
  { hourUTC: 3, minuteUTC: 0 },
  internal.googleReviews.refreshGoogleReviews,
  {},
);

export default crons;
