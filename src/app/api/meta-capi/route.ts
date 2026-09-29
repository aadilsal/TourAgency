import { NextResponse, type NextRequest } from "next/server";

/**
 * Meta Conversions API relay. The browser Pixel event is de-duplicated against
 * this server copy through the shared `event_id`, which keeps lead counts
 * accurate when ad blockers or iOS privacy settings block the pixel.
 *
 * Inert (204) unless NEXT_PUBLIC_META_PIXEL_ID and META_CAPI_ACCESS_TOKEN are
 * both set. The client only calls it after the visitor accepted cookies. No
 * personal data (name/phone/email) is sent — only IP, user agent and Meta's own
 * browser identifiers.
 */

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set(["Lead", "Contact", "ViewContent"]);
const GRAPH_VERSION = "v21.0";

const str = (v: unknown, max: number): string | undefined =>
  typeof v === "string" && v.length > 0 && v.length <= max ? v : undefined;

export async function POST(req: NextRequest) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return new NextResponse(null, { status: 204 });

  // Same-origin calls only, so third-party pages can't push fake events.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin) {
    try {
      if (new URL(origin).host !== host) return new NextResponse(null, { status: 403 });
    } catch {
      return new NextResponse(null, { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const eventName = str(b.eventName, 40);
  const eventId = str(b.eventId, 120);
  if (!eventName || !ALLOWED_EVENTS.has(eventName) || !eventId) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  let sourceUrl: string | undefined;
  const rawUrl = str(b.sourceUrl, 2000);
  if (rawUrl) {
    try {
      const u = new URL(rawUrl);
      if (u.host === host && (u.protocol === "https:" || u.protocol === "http:")) {
        // Drop the query string: it can carry click IDs we don't need to relay.
        sourceUrl = `${u.origin}${u.pathname}`;
      }
    } catch {
      /* omit */
    }
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userData: Record<string, string> = {};
  if (ip) userData.client_ip_address = ip;
  const ua = req.headers.get("user-agent");
  if (ua) userData.client_user_agent = ua;
  const fbp = str(b.fbp, 200);
  const fbc = str(b.fbc, 500);
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: token,
          data: [
            {
              event_name: eventName,
              event_time: Math.floor(Date.now() / 1000),
              event_id: eventId,
              action_source: "website",
              ...(sourceUrl ? { event_source_url: sourceUrl } : {}),
              user_data: userData,
            },
          ],
        }),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok && process.env.NODE_ENV === "development") {
      console.error("[meta-capi] Graph API responded", res.status, await res.text());
    }
  } catch (e) {
    // Measurement must never surface errors to visitors.
    if (process.env.NODE_ENV === "development") console.error("[meta-capi]", e);
  }
  return new NextResponse(null, { status: 204 });
}
