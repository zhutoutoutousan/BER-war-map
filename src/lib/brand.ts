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

export const PROJECT_CREDITS = {
  authors: ["Tian Shao", "Yushu Sue", "Yi Li"] as const,
  institution: "XU University of Applied Sciences",
  institutionLogo: "/xu-university-logo.png",
  courseLabel: "IDI S26",
  probeLabel: "BER+ Flughafenregion probe",
  liveDemoUrl: "https://ber-board-room.vercel.app/"
} as const;
