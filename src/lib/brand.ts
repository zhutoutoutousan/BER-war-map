/** User-facing product name — single source of truth */
export const BRAND = {
  name: "BER+ Board Room",
  shortName: "Board Room",
  mapLabel: "Board Room map",
  tagline: "Data-driven transparency · matching · corridor intelligence",
  region: "Flughafenregion Berlin Brandenburg",
  subtitle: "Ecosystem coordination — one briefing surface",
  sessionPrompt: "Who is using the board room?",
  personaBadge: "Board room for"
} as const;

/** Bilingual business framing — welcome / presentation */
export const BOARD_ROOM_EXPLAINER = {
  storyHook: {
    en: "The story is data-driven — more transparency.",
    de: "Die Story ist datengetrieben — mehr Transparenz."
  },
  en: {
    label: "What is the Board Room?",
    body:
      "A neutral BER+ briefing platform that turns corridor intelligence into evidence on one map — land, assets, programme milestones, and matches, with labelled sources everyone can challenge. Transparency for companies, investors, municipalities, and members before site visits and contracts."
  },
  de: {
    label: "Was ist der Board Room?",
    body:
      "Eine neutrale BER+ Briefing-Plattform, die Korridor-Intelligence als Belege auf einer Karte bündelt — Flächen, Assets, Programm-Meilensteine und Matches, mit gekennzeichneten Quellen, die alle prüfen können. Mehr Transparenz für Unternehmen, Investoren, Kommunen und Mitglieder, bevor Standortbesuche und Verträge anstehen."
  }
} as const;

export const PROJECT_CREDITS = {
  authors: ["Tian Shao", "Yushu Qin", "Yi Li"] as const,
  institution: "XU University of Applied Sciences",
  institutionLogo: "/xu-university-logo.png",
  courseLabel: "IDI S26",
  probeLabel: "BER+ Flughafenregion probe",
  liveDemoUrl: "https://ber-board-room.vercel.app/"
} as const;
