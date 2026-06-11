"use client";

import { MITGLIEDER } from "@/data/mitglieder";
import type { OsmIntelPayload } from "@/lib/osm-schoenefeld";

import { MEMBER_ASSET_INVENTORY } from "@/data/ber-plus-coordination";
import { useCollaborativeInventory } from "@/context/CollaborativeInventoryContext";

type Props = {
  data: OsmIntelPayload;
  landParcelCount: number;
  onLearnMore?: () => void;
};

export function AssetInventorySummary({ data, landParcelCount, onLearnMore }: Props) {
  const { stats: collabStats } = useCollaborativeInventory();
  const infraCount = data.summary.infrastructure?.length ?? data.summary.topTargets?.length ?? 0;
  const memberLinks = Object.values(data.summary.memberLinkCounts).reduce((a, b) => a + b, 0);
  const curated = data.curatedSites.length;

  return (
    <section
      className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 px-3 py-2.5"
      data-testid="asset-inventory-summary"
    >
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/90">
        Corridor asset inventory · step 1
      </div>
      <p className="mt-1 text-[10px] leading-relaxed text-white/50">
        Step 1 toward a member co-built inventory — indicative OSM & curated anchors today; verified
        member registry is the next horizon.
      </p>
      <p className="mt-1.5 text-[10px] font-medium text-emerald-200/85">
        Open question: {MEMBER_ASSET_INVENTORY.followUpQuestion}
      </p>
      <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
        <Stat label="Developable (OSM)" value={`${data.summary.developableHa} ha`} />
        <Stat label="Land parcels" value={String(landParcelCount)} />
        <Stat label="Infra targets" value={String(infraCount)} />
        <Stat label="BER+ land anchors" value={String(curated)} />
        <Stat label="Member OSM links" value={String(memberLinks)} />
        <Stat label="Mitglieder on map" value={String(MITGLIEDER.length)} />
        <Stat label="Co-inventory verified" value={`${collabStats.verified}/${collabStats.total}`} />
      </dl>
      {onLearnMore ? (
        <button
          type="button"
          onClick={onLearnMore}
          className="mt-2.5 w-full rounded-md border border-emerald-500/25 bg-emerald-950/30 py-1.5 text-[10px] font-medium text-emerald-200/90 hover:bg-emerald-950/45"
          data-testid="asset-inventory-learn-more"
        >
          What belongs to members? · inventory roadmap →
        </button>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-white/45">{label}</dt>
      <dd className="font-mono font-semibold text-emerald-100">{value}</dd>
    </div>
  );
}
