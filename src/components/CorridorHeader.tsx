import Link from "next/link";

export function CorridorHeader({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="floating-panel flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-sky-300/70">BER+ War Room</div>
          <div className="truncate text-sm font-semibold text-white">
            Resilience Infrastructure Hub — BER corridor
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <Tag>Pilot-1</Tag>
          <Tag>Module 1.0</Tag>
          <Link
            href="https://www.ber-plus.de/"
            className="rounded-full bg-sky-400/15 px-2 py-0.5 text-sky-100 hover:bg-sky-400/25"
            target="_blank"
            rel="noreferrer"
          >
            ber-plus.de
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="panel flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="text-xs tracking-wide text-white/60">BER+ Resilience Infrastructure Hub</div>
        <div className="text-lg font-semibold text-white">From Pilot-1 to a Scalable EWF-as-a-Service Platform</div>
        <div className="text-sm text-white/70">Corridor briefing — BER+ | 10 min • 21 April 2026</div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Tag>Resilience</Tag>
        <Tag>Module 1.0</Tag>
        <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-100">Pilot-1</span>
        <Tag>Scale</Tag>
        <Tag>EWF-as-a-Service</Tag>
        <Link
          href="https://www.ber-plus.de/"
          className="rounded-full bg-sky-400/15 px-3 py-1 text-sky-100 hover:bg-sky-400/20"
          target="_blank"
          rel="noreferrer"
        >
          BER+ site
        </Link>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-white/80">{children}</span>;
}
