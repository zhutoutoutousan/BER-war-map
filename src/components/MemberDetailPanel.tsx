import { useMemo } from "react";
import { useOsmIntel } from "@/context/OsmIntelContext";
import {
  CATEGORY_MEMBER_PATHS,
  MEMBER_PATH_OVERRIDES,
  type MemberPathStep
} from "@/data/ber-plus-coordination";
import { BER_LAND_SITES } from "@/data/ber-land-sites";
import {
  BER_PLUS_CHAIR,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  getMitgliedById,
  type Mitglied
} from "@/data/mitglieder";
import { getMemberRecommendations } from "@/lib/member-recommendations";
import { getMemberOsmFeatures, LAND_SITE_MEMBER_IDS } from "@/lib/member-osm-links";
import { MEMBER_ASSET_INVENTORY } from "@/data/ber-plus-coordination";
import type { OsmIntelFeatureProperties } from "@/lib/osm-schoenefeld";
import type { LeftTab } from "@/components/BerPlusValuePanel";

type Props = {
  selectedId: string | null;
  onGoToTab?: (tab: LeftTab) => void;
  /** Logged-in Mitglied — show personalized recs when viewing own profile */
  viewerMemberId?: string | null;
};

export function MemberDetailPanel({ selectedId, onGoToTab, viewerMemberId }: Props) {
  const member = selectedId ? getMitgliedById(selectedId) : null;

  if (!member) {
    return (
      <div className="flex flex-col gap-4" data-testid="panel-member-path">
        <div>
          <div className="text-sm font-semibold text-white">Your path on the BER+ map</div>
          <p className="mt-2 text-sm text-white/65">
            Select a Mitglied to see how this platform helps solve coordination problems: matching,
            asset visibility, and corridor evidence — with clear next steps on the map.
          </p>
        </div>
        <div className="rounded-lg border border-sky-500/20 bg-sky-950/25 p-3">
          <div className="text-xs font-semibold text-sky-200">For BER+ leadership (June 12)</div>
          <p className="mt-1 text-xs text-white/70">
            This is a strategic probe — options to explore in the next 12–24 months, not a finished
            product. Discussion &gt; defending every feature.
          </p>
          {onGoToTab ? (
            <button
              type="button"
              onClick={() => onGoToTab("value")}
              className="mt-2 text-xs font-medium text-sky-200 hover:text-sky-100"
            >
              Open BER+ coordination paths →
            </button>
          ) : null}
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-xs text-white/55">IG Umfeld BER e.V.</div>
          <p className="mt-2 text-sm italic text-white/80">&ldquo;{BER_PLUS_CHAIR.quote}&rdquo;</p>
          <div className="mt-2 text-xs text-white/60">
            — {BER_PLUS_CHAIR.name}, {BER_PLUS_CHAIR.role}
          </div>
        </div>
        <PilotSummary />
      </div>
    );
  }

  return <MemberCard member={member} onGoToTab={onGoToTab} viewerMemberId={viewerMemberId} />;
}

function MemberCard({
  member,
  onGoToTab,
  viewerMemberId
}: {
  member: Mitglied;
  onGoToTab?: (tab: LeftTab) => void;
  viewerMemberId?: string | null;
}) {
  const color = CATEGORY_COLORS[member.category];
  const { data, selectFeature, selectedFeatureId } = useOsmIntel();

  const pathSteps = useMemo(() => {
    const override = MEMBER_PATH_OVERRIDES[member.id];
    if (override) return { headline: override.headline, steps: override.steps };
    return {
      headline: `Path for ${CATEGORY_LABELS[member.category]}`,
      steps: CATEGORY_MEMBER_PATHS[member.category]
    };
  }, [member.id, member.category]);

  const relatedOsm = useMemo(() => {
    if (!data?.geojson) return [];
    return getMemberOsmFeatures(data.geojson, member.id).slice(0, 30);
  }, [data, member.id]);

  const osmCount = data?.summary.memberLinkCounts[member.id] ?? relatedOsm.length;
  const personalRecs = useMemo(() => {
    if (viewerMemberId !== member.id) return [];
    return getMemberRecommendations(member.id, osmCount).slice(0, 3);
  }, [viewerMemberId, member.id, osmCount]);

  const landAnchors = useMemo(
    () =>
      BER_LAND_SITES.filter((s) => (LAND_SITE_MEMBER_IDS[s.id] ?? []).includes(member.id)),
    [member.id]
  );

  return (
    <div className="flex flex-col gap-3" data-testid="panel-member-path">
      <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/25 p-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-300/90">
          Your path · {member.shortName}
        </div>
        <p className="mt-1 text-xs text-white/75">{pathSteps.headline}</p>
        <MemberPathList steps={pathSteps.steps} onGoToTab={onGoToTab} compact />
      </div>

      {personalRecs.length > 0 ? (
        <div className="rounded-lg border border-sky-500/25 bg-sky-950/20 p-2.5">
          <div className="text-[10px] font-bold uppercase tracking-wide text-sky-300/90">
            Your recommendations
          </div>
          <ul className="mt-2 space-y-1.5">
            {personalRecs.map((rec) => (
              <li key={rec.id} className="text-[11px] text-white/70">
                <span className="font-medium text-white/90">{rec.title}</span>
                {onGoToTab ? (
                  <button
                    type="button"
                    onClick={() => onGoToTab(rec.tab)}
                    className="ml-1 text-sky-300 hover:underline"
                  >
                    →
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs text-white/60">{CATEGORY_LABELS[member.category]}</span>
        </div>
        <h2 className="mt-1 text-base font-semibold text-white">{member.name}</h2>
        <p className="mt-1 text-sm text-sky-100/90">{member.corridorRole}</p>
      </div>

      <p className="text-sm leading-relaxed text-white/75">{member.intro}</p>
      {member.introDe ? <p className="text-sm leading-relaxed text-white/55">{member.introDe}</p> : null}

      {member.quote ? (
        <blockquote className="rounded-lg border-l-2 border-emerald-400/50 bg-white/5 px-3 py-2">
          <p className="text-sm italic text-white/80">&ldquo;{member.quote}&rdquo;</p>
          {member.quoteAuthor ? (
            <footer className="mt-2 text-xs text-white/55">— {member.quoteAuthor}</footer>
          ) : null}
        </blockquote>
      ) : null}

      {member.tags?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {member.tags.map((t) => (
            <span key={t} className="rounded-full bg-white/8 px-2 py-0.5 text-xs text-white/60">
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <a
          href={member.website}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-sky-200 hover:text-sky-100"
        >
          ber-plus.de link →
        </a>
        {member.projectUrl ? (
          <a
            href={member.projectUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-white/60 hover:text-white/80"
          >
            BER corridor project →
          </a>
        ) : null}
      </div>

      {landAnchors.length > 0 ? (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-2">
          <div className="text-xs font-semibold text-amber-100">BER+ land anchors</div>
          <p className="mt-1 text-[10px] text-amber-100/70">
            Curated for the probe — {MEMBER_ASSET_INVENTORY.notYet.toLowerCase()}
          </p>
          {onGoToTab ? (
            <button
              type="button"
              onClick={() => onGoToTab("inventory")}
              className="mt-2 text-[10px] font-medium text-emerald-300 hover:text-emerald-200"
            >
              Co-inventory demo · propose or verify rows →
            </button>
          ) : null}
          <ul className="mt-1 space-y-1">
            {landAnchors.map((s) => (
              <li key={s.id} className="text-[11px] text-white/75">
                {s.name} · {s.areaHa} ha
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {relatedOsm.length > 0 ? (
        <div className="rounded-lg border border-amber-500/20 bg-black/30 p-2">
          <div className="text-xs font-semibold text-amber-200">
            Linked assets on map ({data?.summary.memberLinkCounts[member.id] ?? relatedOsm.length})
          </div>
          <p className="mt-0.5 text-[10px] text-white/45">
            Visibility & matching — click to locate on map
          </p>
          <ul className="war-room-scroll mt-2 max-h-none space-y-0.5 md:max-h-36 md:overflow-y-auto md:overscroll-y-contain">
            {relatedOsm.map((f) => {
              const p = f.properties as OsmIntelFeatureProperties;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => selectFeature(selectedFeatureId === p.id ? null : p.id)}
                    className={`w-full rounded px-2 py-1 text-left text-[10px] ${
                      selectedFeatureId === p.id
                        ? "bg-amber-950/50 text-amber-100 ring-1 ring-amber-500/40"
                        : "text-white/70 hover:bg-white/5"
                    }`}
                  >
                    {p.name}
                    <span className="text-white/40">
                      {" "}
                      · {p.category}/{p.subcategory}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-[11px] text-white/45">
          No OSM links yet — BER+ can add keyword / proximity rules in the next onboarding sprint.
        </p>
      )}

      <div className="border-t border-white/10 pt-3">
        <PilotSummary compact />
      </div>
    </div>
  );
}

function MemberPathList({
  steps,
  onGoToTab,
  compact
}: {
  steps: MemberPathStep[];
  onGoToTab?: (tab: LeftTab) => void;
  compact?: boolean;
}) {
  return (
    <ol className={`mt-2 space-y-1.5 ${compact ? "" : ""}`}>
      {steps.slice(0, compact ? 3 : steps.length).map((step, i) => (
        <li key={i} className="text-[11px] text-white/70">
          <span className="font-medium text-white/85">{step.problem}</span>
          {onGoToTab ? (
            <button
              type="button"
              onClick={() => onGoToTab(step.mapFocus)}
              className="ml-1 text-sky-300/90 hover:underline"
            >
              → {step.mapFocus === "junqingchu" ? "OSM Intel" : step.mapFocus}
            </button>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function PilotSummary({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "text-xs" : ""}>
      <div className={`font-semibold text-white ${compact ? "text-xs" : "text-sm"}`}>
        Pilot-1 (SEGRO) — first realistic step
      </div>
      <div className={`mt-1 text-white/70 ${compact ? "text-xs" : "text-sm"}`}>
        2.0 ha · PV 2 MWp · BESS 1.5 MWh · EWF — Phase I validate (12–24 months)
      </div>
    </div>
  );
}
