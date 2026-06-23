export function normalizeHashtag(input: unknown): string {
  const cleaned = String(input ?? "")
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, "")
    .toLowerCase();

  return cleaned ? `#${cleaned}` : "";
}

export function normalizeHashtagValue(input: unknown): string {
  return normalizeHashtag(input).replace(/^#/, "");
}

export function parseHashtags(input: string): string[] {
  const seen = new Set<string>();

  return input
    .split(/[\s,]+/)
    .map(normalizeHashtagValue)
    .filter((tag) => {
      if (!tag || seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });
}

export function normalizeHashtagList(input: unknown[] | undefined | null): string[] {
  const seen = new Set<string>();

  return (input ?? [])
    .map(normalizeHashtag)
    .filter((tag) => {
      if (!tag || seen.has(tag)) return false;
      seen.add(tag);
      return true;
    });
}
