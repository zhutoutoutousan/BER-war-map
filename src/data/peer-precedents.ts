import { getBenchmarkById } from "@/data/benchmarks";

/** Five credibility buckets — not copies, proof the pattern works elsewhere */
export type PeerApproachId =
  | "regional-development"
  | "innovation-ecosystem"
  | "location-intelligence"
  | "startup-directory"
  | "airport-region";

export type PeerExample = {
  name: string;
  region: string;
  /** One line: what value it creates */
  value: string;
  sourceUrl: string;
  sourceLabel: string;
  /** Link to in-app benchmark card + map teleport when set */
  benchmarkId?: string;
};

export type PeerApproachType = {
  id: PeerApproachId;
  title: string;
  pitch: string;
  accent: string;
  examples: PeerExample[];
};

export const PEER_APPROACH_HEADLINE =
  "Similar approaches already create value elsewhere";

export const PEER_APPROACH_SUB =
  "BER+ is not inventing from zero — regional hosts, associations, and agencies worldwide use map-linked coordination surfaces. We learn from them; we do not copy them.";

export const PEER_APPROACH_TYPES: PeerApproachType[] = [
  {
    id: "regional-development",
    title: "Regional development platforms",
    pitch: "Public agencies combine geo inventory, sector narrative, and investor concierge.",
    accent: "#22d3ee",
    examples: [
      {
        name: "VLAIO + Geopunt",
        region: "Flanders · BE",
        value: "National industrial-site layers + tailor-made location shortlists for FDI.",
        sourceUrl: "https://www.vlaio.be/en/guidance-advice/vlaio-supports-foreign-investors/finding-right-location",
        sourceLabel: "VLAIO",
        benchmarkId: "vlaio-geopunt"
      },
      {
        name: "GURU Site Selection",
        region: "US · ArcGIS",
        value: "Map-centric site search, workforce rings, utility layers, and branded RFI exports.",
        sourceUrl: "https://www.esri.com/partners/gis-webtech-a2T70000000TQIsEAO/guru-site-selection-a2d5x000002UKblAAG",
        sourceLabel: "Esri partner"
      },
      {
        name: "Invest in Flanders — logistics",
        region: "Multi-airport · BE",
        value: "~800 EDC density story with explicit airport cargo capacity in sector materials.",
        sourceUrl: "https://invest.flandersinvestmentandtrade.com/en/sectors/logistics-ecosystem",
        sourceLabel: "Invest in Flanders",
        benchmarkId: "invest-flanders-logistics"
      }
    ]
  },
  {
    id: "innovation-ecosystem",
    title: "Innovation ecosystem maps",
    pitch: "Filterable directories of investors, enablers, and programmes — kept current.",
    accent: "#f472b6",
    examples: [
      {
        name: "EcoMap Technologies",
        region: "US · ecosystem builders",
        value: "AI ecosystem maps + relationship manager — single source of truth for referrals.",
        sourceUrl: "https://ecomap.tech/solutions/ecosystem-relationship-manager/",
        sourceLabel: "EcoMap ERM"
      },
      {
        name: "ANDE ecosystem maps",
        region: "Africa · Asia · LatAm",
        value: "10+ years of filterable web directories for entrepreneurs and support orgs.",
        sourceUrl: "https://andeglobal.org/ecosystem-maps/",
        sourceLabel: "ANDE"
      },
      {
        name: "EcosystemOS",
        region: "Global · open layer",
        value: "Shared digital backbone connecting portals, programmes, and actor data.",
        sourceUrl: "https://www.ecosystemos.com/ecosystem-mapping-app.html",
        sourceLabel: "EcosystemOS"
      }
    ]
  },
  {
    id: "location-intelligence",
    title: "Location intelligence platforms",
    pitch: "GIS layers turn land, infra, and constraints into explorable inventory.",
    accent: "#f59e0b",
    examples: [
      {
        name: "AVIAS™ SITES™",
        region: "US airports",
        value: "Parcel map, lease layers, and highest-and-best-use per developable acre.",
        sourceUrl: "https://www.mjinfrasolutions.com/solutions/avias/sites",
        sourceLabel: "AVIAS SITES",
        benchmarkId: "avias-sites"
      },
      {
        name: "Esri — airport planning",
        region: "Global programmes",
        value: "Single location system for constraints, capital phases, and stakeholder dashboards.",
        sourceUrl: "https://www.esri.com/en-us/industries/airports/business-areas/planning-design-development",
        sourceLabel: "Esri airports",
        benchmarkId: "esri-airports"
      },
      {
        name: "IIP Vietnam (IIPMap)",
        region: "Vietnam · FDI",
        value: "GIS industrial zones + drone tours for remote site shortlisting.",
        sourceUrl: "https://iipvietnam.com/the-iip-ecosystem-a-digital-gateway-for-global-fdi-into-vietnam.html",
        sourceLabel: "IIPMap"
      }
    ]
  },
  {
    id: "startup-directory",
    title: "Startup ecosystem directories",
    pitch: "Visible startup graphs help founders, investors, and hosts find each other.",
    accent: "#a78bfa",
    examples: [
      {
        name: "StartupBlink",
        region: "1,500+ cities",
        value: "Global startup map + ecosystem index used by governments and World Bank partners.",
        sourceUrl: "https://www.startupblink.com/startups",
        sourceLabel: "StartupBlink"
      },
      {
        name: "Philippines ecosystem map",
        region: "Start2 Group · 2024",
        value: "360° snapshot of top startups, investors, and enablers for partnership discovery.",
        sourceUrl: "https://technode.global/prnasia/start2-group-unveils-the-2024-philippines-startup-ecosystem-map-a-360-view-of-innovation-and-opportunity/",
        sourceLabel: "Start2 Group"
      },
      {
        name: "Ethiopia ecosystem mapping",
        region: "ANDE · MS4G",
        value: "Filterable directory + PDF report of ecosystem gaps and support providers.",
        sourceUrl: "https://andeglobal.org/ecosystem-map-ethiopia/",
        sourceLabel: "ANDE Ethiopia"
      }
    ]
  },
  {
    id: "airport-region",
    title: "Airport-region coordination tools",
    pitch: "Neutral hosts align airport operators, municipalities, and developers on one corridor view.",
    accent: "#38bdf8",
    examples: [
      {
        name: "Amsterdam Airport Area (AAA)",
        region: "Schiphol corridor · NL",
        value: "Non-profit introductions between companies, land owners, and logistics partners.",
        sourceUrl: "https://isocarp.org/app/uploads/2022/03/ISOCARP_2021_Han_367.pdf",
        sourceLabel: "ISOCARP case study",
        benchmarkId: "schiphol-aaa"
      },
      {
        name: "Kair.Aero toolkit",
        region: "Airport Regions Council",
        value: "Real-time ops, emissions, and OTP dashboards for regional authorities.",
        sourceUrl: "https://www.airportregions.org/toolkit",
        sourceLabel: "ARC toolkit"
      },
      {
        name: "Amsterdam Airport City",
        region: "59 business parks · NL",
        value: "Invest portal placing Schiphol at the core of a metropolitan logistics story.",
        sourceUrl: "https://www.amsterdamairportcity.com/",
        sourceLabel: "amsterdamairportcity.com",
        benchmarkId: "amsterdam-airport-city"
      }
    ]
  }
];

export function resolvePeerExampleUrl(ex: PeerExample): string {
  if (ex.benchmarkId) {
    const b = getBenchmarkById(ex.benchmarkId);
    if (b) return b.sourceUrl;
  }
  return ex.sourceUrl;
}

export function peerExamplesWithBenchmarks(): PeerExample[] {
  return PEER_APPROACH_TYPES.flatMap((t) => t.examples).filter((e) => e.benchmarkId);
}
