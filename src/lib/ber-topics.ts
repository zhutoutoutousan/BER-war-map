/** BER+ corridor relevance — keyword scoring for intelligence filter */

const STRONG = [
  "ber+",
  "flughafen berlin brandenburg",
  "berlin brandenburg airport",
  "flughafenregion",
  "flughafenumfeld",
  "north cargo",
  "schönefelder kreuz",
  "schoenefelder kreuz",
  "neue mitte schönefeld",
  "schönefeld nord",
  "horizn ber",
  "segro park",
  "wirtschaftsinitiative flughafenregion"
];

const MEDIUM = [
  "ber",
  "flughafen",
  "schönefeld",
  "schoenefeld",
  "brandenburg",
  "wildau",
  "dahme-spreewald",
  "logistikpark",
  "logistik",
  "waßmannsdorf",
  "wassmannsdorf",
  "mellensee",
  "flughafen ber",
  "airport berlin",
  "fbb",
  "few berlin",
  "u7 verlängerung",
  "bau-turbo",
  "resilience",
  "microgrid",
  "gewerbegebiet ber",
  "airport city"
];

const WEAK = [
  "südosten berlin",
  "metropolregion",
  "immobilien",
  "wohnungsbau",
  "infrastruktur",
  "pv",
  "bess",
  "wärmenetz",
  "quartiersentwicklung",
  "ansiedlung"
];

export const MIN_RELEVANCE_SCORE = 2;

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

export function scoreBerRelevance(text: string): number {
  const hay = normalize(text);
  let score = 0;

  for (const kw of STRONG) {
    if (hay.includes(normalize(kw))) score += 3;
  }
  for (const kw of MEDIUM) {
    if (hay.includes(normalize(kw))) score += 2;
  }
  for (const kw of WEAK) {
    if (hay.includes(normalize(kw))) score += 1;
  }

  // Avoid false positive: lone "ber" in unrelated words — require context
  if (score === 2 && /\bber\b/.test(hay) && !hay.includes("flughafen") && !hay.includes("schoenefeld") && !hay.includes("schonefeld")) {
    score = 1;
  }

  return score;
}

export function isBerRelated(text: string, minScore = MIN_RELEVANCE_SCORE): boolean {
  return scoreBerRelevance(text) >= minScore;
}
