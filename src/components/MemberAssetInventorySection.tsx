"use client";

import { MEMBER_ASSET_INVENTORY } from "@/data/ber-plus-coordination";

type Props = {
  compact?: boolean;
  onGoToOsmIntel?: () => void;
  onGoToCollabDemo?: () => void;
};

export function MemberAssetInventorySection({ compact, onGoToOsmIntel, onGoToCollabDemo }: Props) {
  const { followUpQuestion, intro, mapRole, ownership, layers, pilotSteps, notYet } =
    MEMBER_ASSET_INVENTORY;

  if (compact) {
    return (
      <section
        className="rounded-lg border border-emerald-500/30 bg-emerald-950/25 px-3 py-2.5"
        data-testid="member-asset-inventory"
      >
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200/95">
          {MEMBER_ASSET_INVENTORY.headline}
        </div>
        <p className="mt-1.5 text-sm font-semibold text-white/90">{followUpQuestion}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/60">{mapRole}</p>
        {onGoToOsmIntel || onGoToCollabDemo ? (
          <div className="mt-2 flex flex-wrap gap-3">
            {onGoToCollabDemo ? (
              <button
                type="button"
                onClick={onGoToCollabDemo}
                className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
                data-testid="go-collab-inventory"
              >
                Try co-inventory demo →
              </button>
            ) : null}
            {onGoToOsmIntel ? (
              <button
                type="button"
                onClick={onGoToOsmIntel}
                className="text-[11px] font-medium text-sky-300/90 hover:text-sky-200"
              >
                Step 1 · OSM Intel →
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-emerald-500/30 bg-gradient-to-br from-emerald-950/35 to-ink-950/50 px-3 py-3"
      data-testid="member-asset-inventory"
    >
      <header>
        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200/95">
          {MEMBER_ASSET_INVENTORY.headline}
        </div>
        <h3 className="mt-2 text-base font-semibold text-white">{followUpQuestion}</h3>
        <p className="mt-1.5 text-[11px] leading-relaxed text-white/65">{intro}</p>
      </header>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <StepCard step={1} title="Today · this map" body={mapRole} accent="sky" />
        <StepCard step={2} title="Next · with Mitglieder" body={ownership} accent="emerald" />
      </div>

      <div className="mt-3 space-y-2">
        {layers.map((layer) => (
          <article
            key={layer.id}
            className="rounded-md border border-white/10 bg-black/25 px-2.5 py-2"
            data-testid={`inventory-layer-${layer.id}`}
          >
            <h4 className="text-[11px] font-semibold text-emerald-100/95">{layer.title}</h4>
            <p className="mt-0.5 text-[10px] italic text-white/50">{layer.memberQuestion}</p>
            <dl className="mt-1.5 space-y-1 text-[10px]">
              <div>
                <dt className="font-medium text-sky-300/80">On map now</dt>
                <dd className="text-white/60">{layer.onMapToday}</dd>
              </div>
              <div>
                <dt className="font-medium text-emerald-300/80">Verified inventory</dt>
                <dd className="text-white/60">{layer.verifiedNext}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="mt-3 rounded-md border border-white/10 bg-black/30 px-2.5 py-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
          Pilot path with members
        </div>
        <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[10px] text-white/65">
          {pilotSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-amber-100/75">{notYet}</p>

      {onGoToOsmIntel || onGoToCollabDemo ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          {onGoToCollabDemo ? (
            <button
              type="button"
              onClick={onGoToCollabDemo}
              className="flex-1 rounded-lg bg-emerald-600/35 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-600/45"
              data-testid="go-collab-inventory"
            >
              Open co-inventory demo · step 2 →
            </button>
          ) : null}
          {onGoToOsmIntel ? (
            <button
              type="button"
              onClick={onGoToOsmIntel}
              className="flex-1 rounded-lg border border-white/15 py-2 text-xs font-medium text-white/75 hover:bg-white/5"
              data-testid="go-osm-intel-inventory"
            >
              OSM Intel · step 1 →
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function StepCard({
  step,
  title,
  body,
  accent
}: {
  step: number;
  title: string;
  body: string;
  accent: "sky" | "emerald";
}) {
  const ring = accent === "sky" ? "border-sky-500/30 bg-sky-950/25" : "border-emerald-500/30 bg-emerald-950/20";
  const badge = accent === "sky" ? "bg-sky-500/25 text-sky-100" : "bg-emerald-500/25 text-emerald-100";
  return (
    <div className={`rounded-md border px-2.5 py-2 ${ring}`}>
      <div className="flex items-center gap-2">
        <span className={`rounded px-1.5 py-px text-[10px] font-bold ${badge}`}>Step {step}</span>
        <span className="text-[11px] font-semibold text-white/90">{title}</span>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-white/60">{body}</p>
    </div>
  );
}
