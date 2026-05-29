/** OSM assets that are valid corridor context but poor matching-review targets. */
const LOW_VALUE_AEROWAY = new Set([
  "navigationaid",
  "beacon",
  "vor",
  "dme",
  "ndb",
  "ils",
  "marker",
  "windsock",
  "papi",
  "approach"
]);

export function isLowValueOsmAsset(category?: string, subcategory?: string): boolean {
  if (category !== "aeroway") return false;
  return LOW_VALUE_AEROWAY.has((subcategory ?? "").toLowerCase());
}

export function adjustOsmLinkScore(
  base: number,
  category?: string,
  subcategory?: string
): number {
  if (isLowValueOsmAsset(category, subcategory)) return Math.max(0, base - 24);
  return base;
}

/** Skip member graph edges for infrastructure points that only add noise. */
export function includeOsmInMemberGraph(
  score: number,
  category?: string,
  subcategory?: string
): boolean {
  if (!isLowValueOsmAsset(category, subcategory)) return true;
  return score >= 14;
}
