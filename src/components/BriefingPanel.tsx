import Link from "next/link";
import { COORDINATION_THEMES, STRATEGIC_PROBE } from "@/data/ber-plus-coordination";
import type { LeftTab } from "@/components/BerPlusValuePanel";

type Props = {
  onGoToTab?: (tab: LeftTab) => void;
};

export function BriefingPanel({ onGoToTab }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-sky-500/20 bg-sky-950/20 px-3 py-2">
        <div className="text-xs font-semibold text-sky-200">Evidence for June 12</div>
        <p className="mt-1 text-xs text-white/70">
          Strategic option + corridor evidence — Module 1.0 answers grid and resilience pain today,
          not in 2045.
        </p>
        {onGoToTab ? (
          <button
            type="button"
            onClick={() => onGoToTab("value")}
            className="mt-2 text-xs text-sky-200 hover:underline"
          >
            Full BER+ coordination framing →
          </button>
        ) : null}
      </div>

      <div>
        <div className="text-sm font-semibold text-white">The BER+ dilemma (why now)</div>
        <div className="mt-2 space-y-2 text-sm text-white/75">
          <div>
            <div className="font-medium text-white/85">Grid congestion, stalled growth</div>
            <div>New users wait months–years for connection; investment stalls.</div>
          </div>
          <div>
            <div className="font-medium text-white/85">Single point of failure</div>
            <div>Airport & industry depend on a fragile public grid; outages are high-impact.</div>
          </div>
          <div>
            <div className="font-medium text-white/85">Cost & compliance crisis</div>
            <div>CO₂ exposure drives reporting burden and carbon tax risk as load grows.</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white/5 p-3">
        <div className="text-sm font-semibold text-white">Our probe: Resilience Module 1.0</div>
        <div className="mt-2 text-sm text-white/75">
          A standardized, financeable Infrastructure-as-a-Service product — first provable unit at
          Pilot-1, then platform scale for BER+ coordination.
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/75">
          <li>Rooftop PV + containerized BESS</li>
          <li>EWF: modular treatment + vertical farm</li>
          <li>Microgrid demo + utility corridor spine</li>
        </ul>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase text-white/45">Value for members & region</div>
        <ul className="mt-2 space-y-1.5 text-xs text-white/70">
          {COORDINATION_THEMES.slice(0, 2).map((t) => (
            <li key={t.id}>
              <span className="text-amber-200/90">{t.title}:</span> {t.platformAnswer}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href="/briefing"
          className="rounded-lg bg-white/10 px-3 py-2 text-center text-sm font-medium text-white hover:bg-white/15"
        >
          Open full briefing narrative
        </Link>
        <div className="text-xs text-white/55">
          {STRATEGIC_PROBE.horizon}
        </div>
        <div className="text-xs text-white/55">
          Sources:{" "}
          <a
            className="text-sky-200 hover:text-sky-100"
            href="https://corporate.berlin-airport.de/en/nachhaltigkeit/klima/energie.html"
            target="_blank"
            rel="noreferrer"
          >
            FBB Energy
          </a>
          {" · "}
          <a className="text-sky-200 hover:text-sky-100" href="https://few.berlin-airport.de/" target="_blank" rel="noreferrer">
            FEW
          </a>
          {" · "}
          <a
            className="text-sky-200 hover:text-sky-100"
            href="https://www.bundesnetzagentur.de/DE/Fachthemen/ElektrizitaetundGas/Netzanschluss/start.html"
            target="_blank"
            rel="noreferrer"
          >
            BNetzA Netzanschluss
          </a>
        </div>
      </div>
    </div>
  );
}
