/**
 * Turns thrown errors, Convex messages, and API strings into safe, human copy.
 * Never surfaces raw status codes, stack traces, or internal identifiers.
 */

const GENERIC =
  "Something went wrong on our side. Please try again in a moment.";

const GENERIC_TRY_AGAIN = "We couldn’t complete that. Please try again.";

const EXACT: Record<string, string> = {
  "missing fields": "Please fill in all required fields.",
  "email already registered":
    "An account with this email already exists. Try logging in instead.",
  "invalid email or password":
    "That email or password doesn’t match our records. Check and try again.",
  unauthorized: "Please sign in again to continue.",
  "user already exists":
    "An account with this email already exists. Try logging in instead.",
  "super admin only":
    "You don’t have permission to do that. Ask a super admin if you need access.",
  "name is required": "Please enter your name.",
  "tour not found": "That tour is no longer available.",
  "tour not available":
    "This tour isn’t available for booking right now. Pick another date or contact us.",
  "not authenticated": "Please sign in to continue.",
  "admin access required":
    "You need an admin account to do that. Sign in with the right role.",
  "super admin access required":
    "Only a super admin can do that. Contact your organization owner.",
  "at least one traveler is required": "Add at least one traveler.",
  "user not found": "We couldn’t find that user.",
  "cannot change super admin": "Super admin roles can’t be changed here.",
  "cannot demote yourself": "You can’t remove your own admin access.",
  "cannot demote super admin": "Super admin accounts can’t be demoted here.",
  "planner session not found": "Your chat session expired. Refresh the page and try again.",
  "request not found": "We couldn’t find that request anymore.",
  "only http(s) image urls can be ingested":
    "Please use a normal web link that starts with http or https.",
  "url does not point to an image":
    "That link doesn’t look like an image file. Try a direct image URL.",
  "image too large (max 12mb)": "That image is too large. Use one under 12 MB.",
  "itinerary must be a non-empty json array":
    "Itinerary must be a JSON array with at least one day.",
  "invalid itinerary row":
    "Check each day in your itinerary JSON has a title and description.",
  "no storageid from upload":
    "Upload didn’t complete properly. Try again or use a smaller image.",
};

const PREFIXES: { test: (s: string) => boolean; message: string }[] = [
  {
    test: (s) => s.includes("groq_api_key") || s.includes("not configured"),
    message:
      "The trip assistant isn’t configured right now. Please try again later or contact us.",
  },
  {
    test: (s) => s.startsWith("groq error:") || s.includes("groq error"),
    message:
      "The assistant is having trouble right now. Please try again in a moment.",
  },
  {
    test: (s) => s.includes("download failed"),
    message: "We couldn’t download that file. Check the link and try again.",
  },
  {
    test: (s) => s.includes("upload failed"),
    message: "The file didn’t upload. Check your connection and try again.",
  },
  {
    test: (s) => s.includes("storageid"),
    message: "Upload didn’t finish correctly. Try again.",
  },
  {
    test: (s) => s.includes("convex") && s.includes("failed"),
    message: GENERIC,
  },
];

function normalizeRaw(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "string") return input;
  if (input instanceof Error) return input.message || "";
  try {
    return String(input);
  } catch {
    return "";
  }
}

function stripTechnicalNoise(s: string): string {
  let t = s.trim();
  t = t.replace(/^\[CONVEX[^\]]*]\s*/i, "");
  t = t.replace(/^uncaught error:\s*/i, "");
  t = t.replace(/^error:\s*/i, "");
  t = t.replace(/\s+/g, " ");
  return t.trim();
}

function looksLikeTechnical(s: string): boolean {
  if (!s) return true;
  if (s.length > 220) return true;
  if (/^\d{3}\s/.test(s) || /^http\s/i.test(s)) return true;
  if (/at\s+\S+\s+\(/i.test(s)) return true;
  if (/node:internal|webpack|chunk-|0x[0-9a-f]+/i.test(s)) return true;
  if (/\[object\s/i.test(s)) return true;
  return false;
}

export function toUserFacingErrorMessage(input: unknown): string {
  const raw = stripTechnicalNoise(normalizeRaw(input));
  if (!raw) return GENERIC_TRY_AGAIN;

  const lower = raw.toLowerCase().replace(/\.+$/, "").trim();

  if (looksLikeTechnical(raw) && !EXACT[lower]) {
    const matched = PREFIXES.find((p) => p.test(lower));
    if (matched) return matched.message;
    return GENERIC;
  }

  if (EXACT[lower]) return EXACT[lower];

  for (const { test, message } of PREFIXES) {
    if (test(lower)) return message;
  }

  if (looksLikeTechnical(raw)) return GENERIC;

  const sentence =
    raw.charAt(0).toUpperCase() + raw.slice(1).replace(/\.$/, "") + ".";
  if (sentence.length > 160) return GENERIC_TRY_AGAIN;
  return sentence;
}
