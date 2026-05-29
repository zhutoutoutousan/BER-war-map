"use client";

import { CATEGORY_COLORS, CATEGORY_LABELS, type Mitglied } from "@/data/mitglieder";
import { listMembersForPicker } from "@/lib/member-recommendations";
import { useUserSession } from "@/context/UserSessionContext";

export function SessionPickerModal() {
  const { showPicker, loginAsGuest, loginAsMember } = useUserSession();

  if (!showPicker) return null;

  const members = listMembersForPicker();
  const byCategory = groupByCategory(members);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink-950/92 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-picker-title"
      data-testid="session-picker-modal"
    >
      <div className="war-room-scroll max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-ink-900/95 p-5 shadow-2xl shadow-black/50 sm:p-6">
        <header className="text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300/80">
            BER+ Coordination Map
          </div>
          <h1 id="session-picker-title" className="mt-2 text-xl font-semibold text-white sm:text-2xl">
            Who is using the war room?
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/65">
            Choose guest for the full corridor view, or sign in as your Mitglied for personalized
            recommendations, asset matches, and your corridor scroll map.
          </p>
        </header>

        <button
          type="button"
          onClick={loginAsGuest}
          data-testid="session-guest"
          className="mt-6 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left transition hover:border-sky-400/40 hover:bg-sky-950/30"
        >
          <div className="text-sm font-semibold text-white">Continue as guest</div>
          <div className="mt-1 text-xs text-white/55">
            Full BER+ map · all Mitglieder · coordination themes — no personalization
          </div>
        </button>

        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/45">
            Log in as Mitglied
          </div>
          <p className="mt-1 text-[11px] text-white/45">
            Demo login — your path, linked assets, peer matches, and corridor panorama
          </p>

          <div className="mt-4 space-y-5">
            {Object.entries(byCategory).map(([category, list]) => (
              <section key={category}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]
                    }}
                  />
                  <span className="text-[11px] font-medium text-white/50">
                    {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                  </span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {list.map((m) => (
                    <MemberLoginButton key={m.id} member={m} onSelect={() => loginAsMember(m.id)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] italic text-white/35">
          Strategic probe for June 12 — indicative OSM, not cadastral GIS
        </p>
      </div>
    </div>
  );
}

function MemberLoginButton({ member, onSelect }: { member: Mitglied; onSelect: () => void }) {
  const color = CATEGORY_COLORS[member.category];
  return (
    <button
      type="button"
      data-testid={`session-member-${member.id}`}
      onClick={onSelect}
      className="flex items-start gap-2.5 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-left transition hover:border-white/25 hover:bg-white/5"
    >
      <span
        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}66` }}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-white">{member.shortName}</span>
        <span className="mt-0.5 block truncate text-[11px] text-white/50">{member.corridorRole}</span>
      </span>
    </button>
  );
}

function groupByCategory(members: Mitglied[]): Record<string, Mitglied[]> {
  const out: Record<string, Mitglied[]> = {};
  for (const m of members) {
    (out[m.category] ??= []).push(m);
  }
  return out;
}
