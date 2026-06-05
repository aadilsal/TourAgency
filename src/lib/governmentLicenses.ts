function trimLicence(value?: string) {
  const v = value?.trim();
  return v || undefined;
}

/** Individual licence labels for website lists (secondary only when set). */
export function governmentLicenceParts(
  primary?: string,
  secondary?: string,
): string[] {
  const a = trimLicence(primary);
  const b = trimLicence(secondary);
  const parts: string[] = [];
  if (a) parts.push(`Licence #${a}`);
  if (b) parts.push(`Licence #${b}`);
  return parts;
}

/** Format one or two government licence numbers for PDF headers and cover lines. */
export function formatGovernmentLicenceLine(
  primary?: string,
  secondary?: string,
): string | undefined {
  const parts = governmentLicenceParts(primary, secondary);
  if (parts.length === 0) return undefined;
  return parts.join(" · ");
}
