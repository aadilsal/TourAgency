import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

/**
 * Private, transactional or API routes. These pages also send `noindex`; keep
 * the two in sync (a disallowed page can't be crawled to see its noindex, but
 * also won't be fetched for content).
 */
const PRIVATE_PATHS = [
  "/admin",
  "/dashboard",
  "/api/",
  "/login",
  "/register",
  "/thank-you",
];

/**
 * AI search / assistant crawlers, allowed explicitly so the policy is visible
 * and a future blanket rule can't silently lock them out. Being cited by
 * ChatGPT, Claude, Perplexity, Gemini and Apple Intelligence sends travellers
 * to the site.
 *  - Search / user-triggered fetchers: OAI-SearchBot, ChatGPT-User,
 *    Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User.
 *  - Training-related tokens: GPTBot, ClaudeBot, Google-Extended,
 *    Applebot-Extended. Allowing them lets the brand appear in model knowledge;
 *    remove a name here to opt out.
 */
const AI_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
];

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      // A crawler matching a named group ignores the "*" group, so the private
      // paths are repeated here.
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
