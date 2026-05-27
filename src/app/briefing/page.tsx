import Link from "next/link";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="panel p-4">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-2 text-sm text-white/75">{children}</div>
    </div>
  );
}

export default function BriefingPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-4 px-4 py-4">
        <div className="panel flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs tracking-wide text-white/60">Corridor briefing — BER+</div>
            <div className="text-lg font-semibold text-white">Resilience Module 1.0</div>
            <div className="text-sm text-white/65">We are not selling a vision. We are delivering a replicable, financeable module — starting with Pilot-1.</div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15">
              Back to map
            </Link>
            <Link href="/news" className="rounded-lg bg-emerald-400/20 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-400/25">
              Intelligence / RSS
            </Link>
          </div>
        </div>

        <Section title="The BER+ Dilemma: A Premier Location, A Third-Grade Grid">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-white/85">Grid congestion, stalled growth</span> — new users wait months–years for
              connection; investment stalls.
            </li>
            <li>
              <span className="font-medium text-white/85">Single point of failure</span> — airport &amp; industry rely on a fragile public
              grid; outages have outsized economic impact.
            </li>
            <li>
              <span className="font-medium text-white/85">Cost &amp; compliance crisis</span> — CO₂ exposure and reporting pressure grow with
              load.
            </li>
          </ul>
          <div className="mt-3 text-xs text-white/55">
            Note: This app keeps the narrative and placeholders; you can wire in the latest verified numbers per source.
          </div>
        </Section>

        <Section title="Our Answer: The BER+ Resilience Module 1.0">
          <div className="space-y-2">
            <div>
              <span className="font-medium text-white/85">Core definition</span>: standardized, financeable IaaS product — first provable
              unit, not the whole new city.
            </div>
            <div>
              <span className="font-medium text-white/85">Pilot-1 blueprint</span>: SEGRO – North Cargo Micro-Hub (≈2.0 ha), rooftop PV +
              containerized BESS, modular water treatment + vertical farm, microgrid demo + utility corridor spine.
            </div>
          </div>
        </Section>

        <Section title="Integration, Not Just Addition">
          <ul className="list-disc space-y-1 pl-5">
            <li>PV roofs → PCC + BESS → microgrid backbone</li>
            <li>EWF loads: treatment + vertical farm, plus cold-chain logistics</li>
            <li>Greywater → treatment → irrigation; airport catering loop potential</li>
            <li>Data &amp; value: meters (kWh/CO₂), certificates (RECs), chain ledger</li>
          </ul>
          <div className="mt-3">We monetize not just electricity, but resilience, green credentials, and resource security.</div>
        </Section>

        <Section title="A Clear Path to Profit & a Responsible Entity">
          <div className="space-y-3">
            <div>
              <div className="font-medium text-white/85">Business model</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Stable revenue: long-term green PPA with airport off-take</li>
                <li>Value-add: RECs / carbon accounting; power sales to tenants</li>
                <li>Platform: future design &amp; O&amp;M fees replicating modules</li>
              </ul>
            </div>
            <div>
              <div className="font-medium text-white/85">Governance</div>
              <div className="mt-2">
                Proposed: <span className="font-medium text-white/85">BER+ Infrastructure SPV</span> invests, builds, and operates all
                Resilience Modules.
              </div>
            </div>
          </div>
        </Section>

        <Section title="A Three-Phase Journey: Validate → Scale → Lead">
          <div className="grid gap-2 md:grid-cols-3">
            <div className="rounded-lg bg-white/5 p-3">
              <div className="text-xs text-white/60">Phase I (0–2y)</div>
              <div className="mt-1 font-medium text-white/85">Validate</div>
              <div className="mt-2">Build Pilot-1; financial close; validate tech, business, governance.</div>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <div className="text-xs text-white/60">Phase II (3–5y)</div>
              <div className="mt-1 font-medium text-white/85">Scale</div>
              <div className="mt-2">Replicate Pilot-N; corridor microgrid; EWF platform company.</div>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <div className="text-xs text-white/60">Phase III (5–10+y)</div>
              <div className="mt-1 font-medium text-white/85">Lead</div>
              <div className="mt-2">BER+ coverage; license EWF module for export.</div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

