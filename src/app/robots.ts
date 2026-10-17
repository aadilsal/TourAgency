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
 * ChatGPT, Claude, Perplexity, Gemini, Copilot, Meta AI, Siri and Alexa sends
 * travellers to the site. Each can also read /llms.txt (a plain-text summary
 * of the business and live tours) and /sitemap.xml.
 *  - Search / user-triggered fetchers: fetch a page when a user asks about us.
 *  - Training-related tokens: let the brand appear in model knowledge.
 * Remove a name here to opt that bot out. Bing (Copilot) and Google (Gemini
 * answers) crawl as Bingbot / Googlebot, covered by the "*" group.
 */
const AI_CRAWLERS = [
  // OpenAI — ChatGPT search, browsing on a user's request, training.
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  // Anthropic — Claude search, fetching on a user's request, training
  // ("anthropic-ai" is the legacy token).
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "anthropic-ai",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google Gemini / Vertex AI grounding
  "Google-Extended",
  // Apple — Siri / Spotlight search and Apple Intelligence
  "Applebot",
  "Applebot-Extended",
  // Meta AI (WhatsApp / Instagram / Facebook assistants)
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  // Amazon (Alexa, Rufus), DuckDuckGo assistant, Mistral Le Chat, Cohere, You.com
  "Amazonbot",
  "DuckAssistBot",
  "MistralAI-User",
  "cohere-ai",
  "YouBot",
  // Common Crawl — open web corpus many AI models learn from.
  "CCBot",
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
