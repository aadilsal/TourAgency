/** Keep in sync with src/lib/googleMapsEmbed.ts */
export function normalizeGoogleMapsEmbedUrl(
  raw?: string | null,
): string | undefined {
  if (!raw?.trim()) return undefined;

  let url = raw.trim();

  const iframeSrc = url.match(/src=["']([^"']+)["']/i);
  if (iframeSrc?.[1]) url = iframeSrc[1].trim();

  if (url.startsWith("//")) url = `https:${url}`;

  if (/^\/?maps\/embed/i.test(url)) {
    url = `https://www.google.com/${url.replace(/^\//, "")}`;
  }

  if (!/^https?:\/\//i.test(url)) {
    return undefined;
  }

  return url;
}
