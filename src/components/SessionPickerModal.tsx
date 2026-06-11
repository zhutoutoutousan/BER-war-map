"use client";



import { CATEGORY_COLORS, CATEGORY_LABELS, type Mitglied } from "@/data/mitglieder";

import { listMembersForPicker } from "@/lib/member-recommendations";

import { BRAND } from "@/lib/brand";
import { GUEST_PERSONAS, type GuestPersona } from "@/lib/guest-personas";

import { useUserSession } from "@/context/UserSessionContext";

import { WelcomeValueSection } from "@/components/WelcomeValueSection";
import { BerPlusMustDoSection } from "@/components/BerPlusMustDoSection";
import { BerPlusRealitySection } from "@/components/BerPlusRealitySection";
import { WhyThisIdeaSection } from "@/components/WhyThisIdeaSection";
import { PeerPrecedentsStrip } from "@/components/PeerPrecedentsStrip";
import { PEER_APPROACH_HEADLINE } from "@/data/peer-precedents";



const PERSONA_ORDER: GuestPersona[] = ["company", "investor", "municipality", "explore"];



export function SessionPickerModal() {

  const { showPicker, loginAsGuest, loginAsMember } = useUserSession();



  if (!showPicker) return null;



  const members = listMembersForPicker();

  const byCategory = groupByCategory(members);



  return (

    <div

      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink-950/92 p-0 backdrop-blur-md sm:items-center sm:p-4"

      role="dialog"

      aria-modal="true"

      aria-labelledby="session-picker-title"

      data-testid="session-picker-modal"

    >

      <div className="war-room-scroll mobile-safe-x max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-white/10 bg-ink-900/95 p-4 shadow-2xl shadow-black/50 sm:max-h-[92vh] sm:rounded-2xl sm:p-6 safe-bottom">

        <header className="text-center">

          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300/80">

            {BRAND.name}
          </div>
          <h1 id="session-picker-title" className="mt-2 text-xl font-semibold text-white sm:text-2xl">
            {BRAND.sessionPrompt}
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/65">
            Why it matters · who benefits · what BER+ must run — then a guided tour of the Board Room.
          </p>

        </header>



        <div className="mt-5">

          <WhyThisIdeaSection compact />

        </div>

        <div className="mt-4">

          <WelcomeValueSection />

          <BerPlusMustDoSection compact />

        </div>

        <details className="group mt-4 rounded-lg border border-violet-500/25 bg-violet-950/15 open:pb-3">
          <summary className="cursor-pointer list-none px-3 py-2.5 text-[11px] font-semibold text-violet-100/90 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2">
              <span>{PEER_APPROACH_HEADLINE}</span>
              <span className="text-[10px] font-normal text-white/40 group-open:hidden">Show ↓</span>
              <span className="hidden text-[10px] font-normal text-white/40 group-open:inline">Hide ↑</span>
            </span>
          </summary>
          <div className="px-3 pt-1">
            <PeerPrecedentsStrip compact teaser />
          </div>
        </details>

        <div className="mt-4">
          <BerPlusRealitySection variant="welcome" />
        </div>

        <div className="mt-5">

          <div className="text-xs font-semibold uppercase tracking-wide text-white/45">

            I am here as…

          </div>

          <p className="mt-1 text-[11px] text-white/45">

            Each path opens a short scenario — then a live walkthrough: the map moves through your search.

          </p>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">

            {PERSONA_ORDER.map((id) => {

              const p = GUEST_PERSONAS[id];

              return (

                <button

                  key={id}

                  type="button"

                  data-testid={`session-persona-${id}`}

                  onClick={() => loginAsGuest(id)}

                  className="rounded-xl border border-white/12 bg-white/5 px-3 py-3 text-left transition touch-manipulation hover:border-sky-400/35 hover:bg-sky-950/25"

                >

                  <div className="text-sm font-semibold text-white">{p.label}</div>

                  <div className="mt-1 text-[11px] text-white/55">{p.subtitle}</div>

                </button>

              );

            })}

          </div>

        </div>



        <div className="mt-6">

          <div className="text-xs font-semibold uppercase tracking-wide text-white/45">

            Log in as Mitglied

          </div>

          <p className="mt-1 text-[11px] text-white/45">

            Demo login — personalized matches, asset links, and corridor panorama

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
          IDI S26 · BER+ Flughafenregion probe — visualize on the map, cite sources in Overview
          <br />
          Indicative OSM — not cadastral GIS · Pilot-1 anchor on map
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

      className="flex min-h-[52px] w-full items-start gap-2.5 rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-left transition touch-manipulation hover:border-white/25 hover:bg-white/5"

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

