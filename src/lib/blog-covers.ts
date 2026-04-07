/** Cover images for blog cards (CMS posts can add slug-specific art later). */
export function blogCoverImage(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes("hunza"))
    return "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80";
  if (s.includes("skardu") || s.includes("k2"))
    return "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=80";
  if (s.includes("swat"))
    return "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80";
  if (s.includes("naran") || s.includes("kaghan"))
    return "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80";
  if (s.includes("pack") || s.includes("gear"))
    return "https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=900&q=80";
  if (s.includes("cost") || s.includes("budget"))
    return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=80";
  return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=80";
}
