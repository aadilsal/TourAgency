import { cronJobs } from "convex/server";
import { internal } from "./_generated/api.js";

const crons = cronJobs();

// Refresh cached Google reviews daily (no-op until GOOGLE_PLACES_API_KEY +
// GOOGLE_PLACE_ID are configured).
crons.daily(
  "refresh google reviews",
  { hourUTC: 3, minuteUTC: 0 },
  internal.googleReviews.refreshGoogleReviews,
  {},
);

export default crons;
