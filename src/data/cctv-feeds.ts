/**
 * Curated public feeds near Schönefeld / BER corridor.
 * Note: Germany has no open municipal street-CCTV like UK; sources are
 * Verkehrskameras (traffic), airport monitors, and official traffic maps.
 */

export type CctvFeedType = "iframe" | "image" | "external" | "dynamic";

export type CctvFeed = {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  type: CctvFeedType;
  /** iframe src, image URL, or external page */
  url: string;
  coordinates: [number, number];
  operator: string;
  /** Refresh still image every N seconds (image type) */
  refreshSeconds?: number;
  /** km from Schönefeld town centre */
  distanceKm?: number;
};

/** Schönefeld / BER reference point */
export const SCHOENEFELD_CENTER: [number, number] = [13.52, 52.38];

export const CURATED_CCTV_FEEDS: CctvFeed[] = [
  {
    id: "viz-berlin",
    name: "VIZ Berlin — Verkehrslage",
    subtitle: "Official traffic map",
    description:
      "SenMVKU Verkehrsinformationszentrale: live traffic colours on Berlin streets (feeds BER corridor via A113 / A100).",
    type: "iframe",
    url: "https://viz.berlin.de/verkehr-in-berlin/verkehrslage/",
    coordinates: [13.42, 52.48],
    operator: "Berlin VIZ",
    distanceKm: 18
  },
  {
    id: "windy-ber-corridor",
    name: "Windy — Regional webcam",
    subtitle: "Embed player",
    description: "Public weather/traffic webcam embed in the Berlin–Brandenburg area.",
    type: "iframe",
    url: "https://webcams.windy.com/webcams/public/embed/player/1265917507/day",
    coordinates: [13.48, 52.42],
    operator: "Windy",
    distanceKm: 12
  },
  {
    id: "flightradar-eddb",
    name: "Flightradar24 — EDDB / BER",
    subtitle: "Airport movements",
    description: "Live aircraft at Berlin Brandenburg (airside monitor, not street CCTV).",
    type: "external",
    url: "https://www.flightradar24.com/data/airports/eddb",
    coordinates: [13.503, 52.37],
    operator: "Flightradar24",
    distanceKm: 3
  },
  {
    id: "windfinder-ber",
    name: "Windfinder — BER webcams",
    subtitle: "Nearby live cams",
    description: "List of webcams within 25 km of the airport (Tempelhofer Feld, city centre, etc.).",
    type: "external",
    url: "https://www.windfinder.com/webcams/schoenefeld",
    coordinates: [13.503, 52.37],
    operator: "Windfinder",
    distanceKm: 0
  },
  {
    id: "berlin-rathaus-cam",
    name: "Berlin.de — Rotes Rathaus",
    subtitle: "City panorama (RBB)",
    description: "Schwenkbare Stadt-Webcam Richtung Mitte — useful for capital-region weather/traffic context.",
    type: "external",
    url: "https://www.berlin.de/webcams/4350944-4350835-webcam-am-rotes-rathaus.html",
    coordinates: [13.408, 52.518],
    operator: "Berlin.de / RBB",
    distanceKm: 22
  },
  {
    id: "opencctv-ber",
    name: "opencctv.org — Germany map",
    subtitle: "3,000+ public feeds",
    description:
      "Browse traffic, airport, and weather webcams on an interactive map — fallback when Autobahn API returns no images.",
    type: "external",
    url: "https://opencctv.org/cameras/germany",
    coordinates: [13.52, 52.38],
    operator: "opencctv.org",
    distanceKm: 0
  },
  {
    id: "autobahn-traffic",
    name: "Autobahn GmbH — Webcams",
    subtitle: "A10 · A113 · A13",
    description:
      "Official motorway Verkehrskameras (dynamic). Covers BER access: A113, Berliner Ring A10, A13 Dresden corridor.",
    type: "dynamic",
    url: "https://verkehr.autobahn.de/",
    coordinates: [13.52, 52.36],
    operator: "Autobahn GmbH",
    distanceKm: 2
  },
  {
    id: "viz-brandenburg",
    name: "VIZ — Baustellen & Störungen",
    subtitle: "Construction / incidents",
    type: "external",
    url: "https://viz.berlin.de/verkehr-in-berlin/baustellen-sperrungen-und-sonstige-storungen/",
    description: "Roadworks and disruptions affecting drives to/from Schönefeld.",
    coordinates: [13.42, 52.48],
    operator: "Berlin VIZ",
    distanceKm: 18
  }
];
