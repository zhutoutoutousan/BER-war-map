"use client";

import { useCallback, useMemo, useState } from "react";
import { useOsmIntel } from "@/context/OsmIntelContext";
import { useMapActions } from "@/context/MapActionsContext";
import { CATEGORY_COLORS, CATEGORY_LABELS, getMitgliedById } from "@/data/mitglieder";
import { getMemberFollowUpDemo } from "@/lib/member-recommendations";
import {
  buildLiveMatches,
  matchesForGraph,
  type LiveMatch
} from "@/lib/local-member-matching";
import { CorridorPanoramaGraph } from "@/components/CorridorPanoramaGraph";
import type { LeftTab } from "@/components/BerPlusValuePanel";

type Props = {
  memberId: string;
  onGoToTab: (tab: LeftTab) => void;
  onSelectMember: (id: string) => void;
  onOpenGiantMap?: () => void;
};

export function MemberHomePanel({ memberId, onGoToTab, onSelectMember, onOpenGiantMap }: Props) {
  const member = getMitgliedById(memberId);
  const { data, loading: osmLoading, selectFeature } = useOsmIntel();
  const { focusLandSite, focusMember, flyTo } = useMapActions();
  const [activeId, setActiveId] = useState<string | null>(null);

  const liveMatches = useMemo(
    () => buildLiveMatches(memberId, data?.geojson ?? null),
    [memberId, data?.geojson]
  );
  const graphMatches = useMemo(
    () => matchesForGraph(memberId, data?.geojson ?? null),
    [memberId, data?.geojson]
  );
  const followUp = useMemo(() => getMemberFollowUpDemo(memberId), [memberId]);

  const executeMatch = useCallback(
    (match: LiveMatch) => {
      setActiveId(match.id);
      onGoToTab(match.tab);

      if (match.landSiteId) {
        focusLandSite(match.landSiteId);
        selectFeature(`curated/${match.landSiteId}`);
        return;
      }

      if (match.osmFeatureId) {
        selectFeature(match.osmFeatureId);
        if (match.center) flyTo(match.center, 14.2);
        return;
      }

      if (match.peerMemberId) {
        onSelectMember(match.peerMemberId);
        focusMember(match.peerMemberId);
        return;
      }

      if (match.center) flyTo(match.center, 12.8);
    },
    [focusLandSite, focusMember, flyTo, onGoToTab, onSelectMember, selectFeature]
  );

  const handleGraphNode = useCallback(
    (nodeId: string) => {
      if (nodeId.startsWith("member-")) {
        const id = nodeId.replace("member-", "");
        onSelectMember(id);
        focusMember(id);
        onGoToTab("members");
        return;
      }
      if (nodeId.startsWith("land-")) {
        const siteId = nodeId.replace("land-", "");
        const match = liveMatches.find((m) => m.landSiteId === siteId);
        if (match) executeMatch(match);
        else {
          focusLandSite(siteId);
          onGoToTab("junqingchu");
        }
        return;
      }
      if (nodeId.startsWith("osm-")) {
        const osmId = nodeId.replace("osm-", "");
        const match = liveMatches.find((m) => m.osmFeatureId === osmId);
        if (match) executeMatch(match);
      }
    },
    [executeMatch, focusLandSite, focusMember, liveMatches, onGoToTab, onSelectMember]
  );

  if (!member) return null;

  const color = CATEGORY_COLORS[member.category];

  return (
    <div
      className="war-room-scroll flex max-h-[min(78vh,680px)] flex-col gap-4 overflow-y-auto pr-1"
      data-testid="panel-member-home"
    >
      <header className="rounded-lg border border-emerald-500/30 bg-emerald-950/25 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-300/90">
            For you · {member.shortName}
          </span>
        </div>
        <h2 className="mt-1 text-sm font-semibold text-white">{followUp.headline}</h2>
        <p className="mt-1 text-xs text-white/60">
          {CATEGORY_LABELS[member.category]} · {liveMatches.length} local matches
          {osmLoading ? " (loading OSM…)" : data ? " from OSM + land rules" : ""}
        </p>
      </header>

      <CorridorPanoramaGraph
        memberId={memberId}
        osmMatches={graphMatches}
        onSelectNode={handleGraphNode}
        onOpenGiantMap={onOpenGiantMap}
      />

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">
          Recommended for you
          <span className="ml-2 font-normal normal-case text-white/35">click to fly on map</span>
        </h3>
        {osmLoading && liveMatches.length === 0 ? (
          <p className="mt-2 text-xs text-white/45">Loading OSM corridor data…</p>
        ) : liveMatches.length === 0 ? (
          <p className="mt-2 text-xs text-white/45">No matches yet — check OSM Intel tab.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {liveMatches.slice(0, 8).map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                active={activeId === match.id}
                onAction={() => executeMatch(match)}
              />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">Follow-up demo</h3>
        <ol className="mt-2 space-y-1.5">
          {followUp.steps.map((step, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onGoToTab(step.tab)}
                className="w-full rounded-lg border border-white/8 bg-black/25 px-2.5 py-2 text-left text-[11px] text-white/75 hover:border-sky-500/30 hover:bg-sky-950/20"
              >
                <span className="font-medium text-white/90">
                  {i + 1}. {step.label}
                </span>
                <span className="ml-1 text-sky-300/80">→ {tabLabel(step.tab)}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function MatchCard({
  match,
  active,
  onAction
}: {
  match: LiveMatch;
  active: boolean;
  onAction: () => void;
}) {
  const kindLabel =
    match.kind === "osm" ? "OSM" : match.kind === "land" ? "Land" : "Peer";
  const border =
    match.priority === "high"
      ? "border-amber-500/35 bg-amber-950/25"
      : "border-white/10 bg-white/5";

  return (
    <li
      className={`rounded-lg border p-2.5 transition ${border} ${
        active ? "ring-1 ring-sky-400/50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="mr-1.5 rounded bg-white/10 px-1 py-0.5 text-[9px] uppercase text-white/50">
            {kindLabel}
          </span>
          <span className="text-xs font-semibold text-white/90">{match.title}</span>
        </div>
        {match.priority === "high" ? (
          <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] text-amber-200">
            Priority
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] text-white/55">{match.detail}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-2 w-full rounded-md bg-sky-500/20 py-1.5 text-[11px] font-medium text-sky-100 hover:bg-sky-500/35"
      >
        {match.cta} →
      </button>
    </li>
  );
}

function tabLabel(tab: LeftTab): string {
  const labels: Record<LeftTab, string> = {
    value: "BER+ Paths",
    foryou: "For you",
    briefing: "Briefing",
    members: "Mitglieder",
    programme: "Programme",
    junqingchu: "OSM Intel"
  };
  return labels[tab];
}
