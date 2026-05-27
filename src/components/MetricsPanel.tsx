function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-lg font-semibold text-white">{value}</div>
      {note ? <div className="mt-1 text-xs text-white/55">{note}</div> : null}
    </div>
  );
}

export function MetricsPanel() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-sm font-semibold text-white">Pilot-1 blueprint</div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Stat label="Site" value="~2.0 ha" note="Between SEGRO Park & BER North Cargo" />
          <Stat label="PV" value="2 MWp" note="Rooftop PV" />
          <Stat label="BESS" value="1.5 MWh" note="Containerized storage" />
          <Stat label="EWF" value="Water+Food" note="Treatment + vertical farm" />
        </div>
      </div>

      <div className="rounded-lg bg-white/5 p-3">
        <div className="text-sm font-semibold text-white">Business model (draft)</div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/75">
          <li>Stable: long-term green PPA with airport off-take</li>
          <li>Value-add: RECs / carbon accounting, tenant power sales</li>
          <li>Platform: design + O&amp;M fees replicating modules</li>
        </ul>
      </div>

      <div className="rounded-lg bg-white/5 p-3">
        <div className="text-sm font-semibold text-white">Delivery entity</div>
        <div className="mt-2 text-sm text-white/75">
          Proposed: <span className="font-medium text-white/85">BER+ Infrastructure SPV</span> invests, builds, and operates all
          modules (equity &amp; MOUs → term-sheet stage; counsel confirms).
        </div>
      </div>
    </div>
  );
}

