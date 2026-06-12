/** User-facing product name — single source of truth */
export const BRAND = {
  name: "BER+ Board Room",
  shortName: "Board Room",
  mapLabel: "Board Room map",
  tagline: "Matching · visibility · corridor intelligence",
  region: "Flughafenregion Berlin Brandenburg",
  subtitle: "Ecosystem coordination — one briefing surface",
  sessionPrompt: "Who is using the board room?",
  personaBadge: "Board room for"
} as const;

/** Bilingual business framing — welcome / presentation */
export const BOARD_ROOM_EXPLAINER = {
  en: {
    label: "What is the Board Room?",
    body:
      "A neutral briefing platform hosted by BER+ for the Flughafenregion corridor. One executive view of land, assets, programme milestones, and partnership opportunities — for companies, investors, municipalities, and members before site visits and contracts."
  },
  de: {
    label: "Was ist der Board Room?",
    body:
      "Eine neutrale Briefing-Plattform von BER+ für den Flughafenregion-Korridor. Ein gemeinsamer Management-Blick auf Flächen, Assets, Programm-Meilensteine und Kooperationschancen — für Unternehmen, Investoren, Kommunen und Mitglieder, bevor Standortbesuche und Verträge anstehen."
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
