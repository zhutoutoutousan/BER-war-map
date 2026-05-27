/**
 * Official BER+ Mitglieder menu — from https://www.ber-plus.de/ (Elementor nav, May 2026).
 * Update this file when the website menu changes; mitglieder.ts merges these URLs.
 */
export type BerPlusMenuEntry = {
  id: string;
  label: string;
  url: string;
};

/** Menu order as on ber-plus.de */
export const BER_PLUS_MEMBERS_MENU: BerPlusMenuEntry[] = [
  { id: "adler", label: "Adler AG", url: "https://adler-ag.com/" },
  { id: "alpine", label: "Alpine Immobilien GmbH", url: "https://alpine-immo.de/" },
  { id: "arcadis", label: "Arcadis", url: "https://www.arcadis.com/de-de" },
  { id: "buwog", label: "BUWOG", url: "https://www.buwog.de" },
  {
    id: "edistherm",
    label: "e.distherm Wärmedienstleistungen GmbH",
    url: "https://www.edistherm.de"
  },
  { id: "gsg", label: "GSG Berlin", url: "https://www.gsg.de/de/" },
  { id: "reiss", label: "Reiß & Co.", url: "https://www.reissco.de/" },
  {
    id: "sector-seven",
    label: "Sector Seven Investors GmbH",
    url: "https://www.sectorseven.de"
  },
  {
    id: "taurecon",
    label: "Taurecon Real Estate Consulting GmbH",
    url: "https://taurecon.com/"
  },
  { id: "wfg-lds", label: "WFG Dahme-Spreewald", url: "https://www.wfg-lds.de/" },
  {
    id: "wfb",
    label: "Wirtschaftsinitiative Flughafenregion Brandenburg (WFB)",
    url: "https://wfb-brandenburg.de/"
  },
  { id: "periskop", label: "Periskop Partners", url: "https://www.periskop.ag/" },
  { id: "goldbeck", label: "GOLDBECK", url: "https://www.goldbeck.de/" },
  { id: "segro", label: "SEGRO", url: "https://www.segro.com" }
];

export const BER_PLUS_MENU_BY_ID = Object.fromEntries(
  BER_PLUS_MEMBERS_MENU.map((e) => [e.id, e])
) as Record<string, BerPlusMenuEntry>;
