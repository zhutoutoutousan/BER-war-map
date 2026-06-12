"use client";



import { CATEGORY_COLORS, CATEGORY_LABELS, type Mitglied } from "@/data/mitglieder";

import { listMembersForPicker } from "@/lib/member-recommendations";

import { BOARD_ROOM_EXPLAINER, BRAND, PROJECT_CREDITS } from "@/lib/brand";
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

        <section
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
          data-testid="session-picker-team"
          aria-label="Project team"
        >
          <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
            {PROJECT_CREDITS.courseLabel} · Team
          </div>
          <div className="mt-3 flex items-center gap-3">
            <img
              src={PROJECT_CREDITS.institutionLogo}
              alt=""
              width={52}
              height={52}
              className="h-[52px] w-[52px] shrink-0 object-contain"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/90">
                {PROJECT_CREDITS.authors.join(" · ")}
              </p>
              <p className="mt-0.5 text-[11px] text-white/50">{PROJECT_CREDITS.institution}</p>
            </div>
          </div>
        </section>

        <a
          href={PROJECT_CREDITS.liveDemoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex flex-col gap-1 rounded-xl border border-sky-500/35 bg-sky-950/35 px-4 py-3 transition hover:border-sky-400/50 hover:bg-sky-950/50"
          data-testid="session-picker-live-demo"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-sky-300/90">
            Audience — open the live demo
          </span>
          <span className="text-sm font-semibold text-sky-100 underline decoration-sky-400/40 underline-offset-2">
            {PROJECT_CREDITS.liveDemoUrl}
          </span>
          <span className="text-[11px] text-white/45">
            Phone or laptop · same walkthrough you see on screen
          </span>
        </a>

        <header className="mt-5 text-center">

          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300/80">

            {BRAND.name}
          </div>

          <div
            className="mx-auto mt-3 max-w-2xl rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-left sm:px-4"
            data-testid="board-room-explainer"
          >
            <p className="border-b border-white/8 pb-3 text-center text-[11px] font-semibold leading-snug text-sky-200/95 sm:text-xs">
              <span lang="en">{BOARD_ROOM_EXPLAINER.storyHook.en}</span>
              <span className="mx-2 text-white/25" aria-hidden>
                ·
              </span>
              <span lang="de">{BOARD_ROOM_EXPLAINER.storyHook.de}</span>
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-300/75">
                  {BOARD_ROOM_EXPLAINER.en.label}
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/72">
                  {BOARD_ROOM_EXPLAINER.en.body}
                </p>
              </div>
              <div className="border-t border-white/8 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-300/75">
                  {BOARD_ROOM_EXPLAINER.de.label}
                </p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/72">
                  {BOARD_ROOM_EXPLAINER.de.body}
                </p>
              </div>
            </div>
          </div>

          <h1 id="session-picker-title" className="mt-4 text-xl font-semibold text-white sm:text-2xl">
            {BRAND.sessionPrompt}
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/65">
            Data-driven transparency · who benefits · what BER+ must run — then a guided tour of the Board
            Room.
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
          {PROJECT_CREDITS.probeLabel} — visualize on the map, cite sources in Overview
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

