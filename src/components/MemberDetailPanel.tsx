import {
  BER_PLUS_CHAIR,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  getMitgliedById,
  type Mitglied
} from "@/data/mitglieder";

type Props = {
  selectedId: string | null;
};

export function MemberDetailPanel({ selectedId }: Props) {
  const member = selectedId ? getMitgliedById(selectedId) : null;

  if (!member) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <div className="text-sm font-semibold text-white">Member profile</div>
          <p className="mt-2 text-sm text-white/65">
            Select a Mitglied on the map or in the list to view corridor role, introduction, and BER+ quotes.
          </p>
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

  return <MemberCard member={member} />;
}

function MemberCard({ member }: { member: Mitglied }) {
  const color = CATEGORY_COLORS[member.category];
  return (
    <div className="flex flex-col gap-3">
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

      <div className="border-t border-white/10 pt-3">
        <PilotSummary compact />
      </div>
    </div>
  );
}

function PilotSummary({ compact }: { compact?: boolean }) {
  return (
    <div className={compact ? "text-xs" : ""}>
      <div className={`font-semibold text-white ${compact ? "text-xs" : "text-sm"}`}>Pilot-1 (SEGRO)</div>
      <div className={`mt-1 text-white/70 ${compact ? "text-xs" : "text-sm"}`}>
        2.0 ha • PV 2 MWp • BESS 1.5 MWh • EWF water + vertical farm
      </div>
    </div>
  );
}
