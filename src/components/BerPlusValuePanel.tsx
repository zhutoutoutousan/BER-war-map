"use client";



import { useState } from "react";

import {

  CATEGORY_MEMBER_PATHS,

  COORDINATION_THEMES,

  MEMBER_PATH_OVERRIDES,

  STRATEGIC_PROBE,

  type MemberPathStep

} from "@/data/ber-plus-coordination";

import { CATEGORY_LABELS, getMitgliedById, type MemberCategory } from "@/data/mitglieder";

import { BRAND } from "@/lib/brand";
import { GUEST_PERSONAS, type GuestPersona } from "@/lib/guest-personas";

import { ValueForWhomSection } from "@/components/ValueForWhomSection";
import { CoordinationProblemStrip } from "@/components/CoordinationProblemStrip";
import { PeerPrecedentsStrip } from "@/components/PeerPrecedentsStrip";
import { MemberAssetInventorySection } from "@/components/MemberAssetInventorySection";
import { BerPlusMustDoSection } from "@/components/BerPlusMustDoSection";
import { BenchmarksPanel } from "@/components/BenchmarksPanel";



type LeftTab = "value" | "foryou" | "briefing" | "members" | "programme" | "junqingchu" | "inventory";



type Props = {

  onGoToTab: (tab: LeftTab) => void;

  selectedMemberCategory?: MemberCategory | null;

  selectedMemberId?: string | null;

  guestPersona?: GuestPersona | null;

  selectedBenchmarkId?: string | null;

  onSelectBenchmark?: (id: string | null) => void;

  onShowBenchmarkOnMap?: (id: string) => void;

  onShowAllBenchmarksOnMap?: () => void;

  osmFeatureCount?: number;

  osmLoading?: boolean;

  onOpenMatching?: () => void;

};



export function BerPlusValuePanel({

  onGoToTab,

  selectedMemberCategory,

  selectedMemberId,

  guestPersona,

  selectedBenchmarkId,

  onSelectBenchmark,

  onShowBenchmarkOnMap,

  onShowAllBenchmarksOnMap,

  osmFeatureCount,

  osmLoading,

  onOpenMatching

}: Props) {

  const [showStrategicContext, setShowStrategicContext] = useState(false);

  const persona = guestPersona ? GUEST_PERSONAS[guestPersona] : null;

  const pathCategory = selectedMemberCategory ?? persona?.categoryHint ?? "developer";



  return (

    <div className="war-room-scroll flex max-h-none flex-col gap-4 overflow-y-auto pr-1 md:max-h-[min(70vh,520px)]" data-testid="panel-ber-paths">

      <header className="rounded-lg border border-sky-500/25 bg-sky-950/30 px-3 py-2.5">

        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-300/90">

          {BRAND.name}
        </div>
        <h2 className="mt-1 text-sm font-semibold text-white">{BRAND.tagline}</h2>
        <p className="mt-1.5 text-xs leading-relaxed text-white/70">{BRAND.subtitle}</p>

      </header>



      <ValueForWhomSection
        guestPersona={guestPersona}
        onGoToTab={onGoToTab}
        onOpenMatching={onOpenMatching}
      />

      <CoordinationProblemStrip personaLabel={persona?.label ?? null} />

      <PeerPrecedentsStrip
        onOpenBenchmark={
          onShowBenchmarkOnMap
            ? (id) => {
                onSelectBenchmark?.(id);
                onShowBenchmarkOnMap(id);
              }
            : undefined
        }
      />

      <BerPlusMustDoSection
        onGoToProgramme={() => onGoToTab("programme")}
        onGoToCollabDemo={() => onGoToTab("inventory")}
      />

      <MemberAssetInventorySection
        onGoToOsmIntel={() => onGoToTab("junqingchu")}
        onGoToCollabDemo={() => onGoToTab("inventory")}
      />

      <BenchmarksPanel
        selectedId={selectedBenchmarkId}
        onSelect={onSelectBenchmark}
        onShowOnMap={onShowBenchmarkOnMap}
        onShowAllOnMap={onShowAllBenchmarksOnMap}
        osmFeatureCount={osmFeatureCount}
        osmLoading={osmLoading}
      />

      <Section title="Value for you">

        {persona ? (

          <p className="mb-2 text-xs text-sky-100/85">

            <span className="font-semibold text-sky-200">{persona.label}</span>

            <span className="text-white/55"> — {persona.subtitle}</span>

          </p>

        ) : null}

        <MemberPathSteps

          steps={pathStepsForMember(selectedMemberId, pathCategory)}

          onGoToTab={onGoToTab}

        />

        <button

          type="button"

          onClick={() => onGoToTab("members")}

          className="mt-2 w-full rounded-lg bg-white/10 py-2 text-xs font-medium text-white hover:bg-white/15"

        >

          Open Mitglieder list →

        </button>

      </Section>



      <Section title="Problem → platform response">

        <ul className="space-y-2.5" data-testid="ber-paths-coordination">

          {COORDINATION_THEMES.map((t) => (

            <li key={t.id} className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-2.5">

              <div className="text-xs font-semibold text-amber-100">{t.title}</div>

              <p className="mt-1 text-[11px] text-white/55">

                <span className="text-white/45">Pain: </span>

                {t.memberPain}

              </p>

              <p className="mt-1 text-[11px] text-sky-100/85">

                <span className="text-sky-300/60">Response: </span>

                {t.platformAnswer}

              </p>

              <p className="mt-1.5 text-[10px] font-medium text-emerald-200/90">

                Pilot step: {t.firstStep}

              </p>

            </li>

          ))}

        </ul>

      </Section>



      <div>

        <button

          type="button"

          onClick={() => setShowStrategicContext((v) => !v)}

          className="text-xs font-medium text-sky-200/90 hover:text-sky-100"

        >

          {showStrategicContext ? "Hide" : "Show"} strategic context (why now, why region) →

        </button>

        {showStrategicContext ? (

          <div className="mt-3 space-y-4">

            <Section title="Why should BER+ care?">

              <BulletList items={STRATEGIC_PROBE.whyBerPlus} />

            </Section>

            <Section title="Why now? (12–24 months)">

              <BulletList items={STRATEGIC_PROBE.whyNow} />

            </Section>

            <Section title="Why this region?">

              <BulletList items={STRATEGIC_PROBE.whyRegion} />

            </Section>

            <p className="text-[10px] italic text-white/40">{STRATEGIC_PROBE.horizon}</p>

          </div>

        ) : null}

      </div>

    </div>

  );

}



function MemberPathSteps({

  steps,

  onGoToTab

}: {

  steps: MemberPathStep[];

  onGoToTab: (tab: LeftTab) => void;

}) {

  return (

    <ol className="space-y-2">

      {steps.map((step, i) => (

        <li key={i} className="rounded-md border border-white/8 bg-black/25 px-2.5 py-2">

          <div className="text-[10px] font-bold text-white/40">Step {i + 1}</div>

          <div className="mt-0.5 text-xs font-medium text-white/90">{step.problem}</div>

          <div className="mt-1 text-[11px] text-white/55">

            <span className="text-emerald-300/80">You see: </span>

            {step.youSee}

          </div>

          <div className="mt-0.5 text-[11px] text-white/55">

            <span className="text-sky-300/80">You do: </span>

            {step.youDo}

          </div>

          <button

            type="button"

            onClick={() => onGoToTab(step.mapFocus)}

            className="mt-2 rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-medium text-sky-100 hover:bg-sky-500/30"

          >

            Go to {tabLabel(step.mapFocus)} →

          </button>

        </li>

      ))}

    </ol>

  );

}



function pathStepsForMember(

  memberId: string | null | undefined,

  category: MemberCategory | null | undefined

): MemberPathStep[] {

  if (memberId) {

    const override = MEMBER_PATH_OVERRIDES[memberId];

    if (override) return override.steps;

    const member = getMitgliedById(memberId);

    if (member) return CATEGORY_MEMBER_PATHS[member.category];

  }

  if (category) return CATEGORY_MEMBER_PATHS[category];

  return CATEGORY_MEMBER_PATHS.developer;

}



function tabLabel(tab: LeftTab): string {

  const labels: Record<LeftTab, string> = {

    value: "Overview",

    foryou: "For you",

    briefing: "Briefing",

    members: "Mitglieder",

    programme: "Programme",

    junqingchu: "OSM Intel",

    inventory: "Asset mgmt"

  };

  return labels[tab];

}



function Section({ title, children }: { title: string; children: React.ReactNode }) {

  return (

    <section>

      <h3 className="text-xs font-semibold uppercase tracking-wide text-white/50">{title}</h3>

      <div className="mt-2">{children}</div>

    </section>

  );

}



function BulletList({ items }: { items: string[] }) {

  return (

    <ul className="list-disc space-y-1 pl-4 text-xs text-white/75">

      {items.map((item) => (

        <li key={item}>{item}</li>

      ))}

    </ul>

  );

}



export type { LeftTab };

