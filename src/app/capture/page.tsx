"use client";

/**
 * Clean layouts for presentation screenshots.
 * Open http://localhost:3000/capture?shot=1 … shot=5 while dev server runs.
 */
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BerPlusValuePanel } from "@/components/BerPlusValuePanel";
import { MapWorkspace } from "@/components/MapWorkspace";
import { COORDINATION_THEMES } from "@/data/ber-plus-coordination";
import { MITGLIEDER } from "@/data/mitglieder";

import { BRAND } from "@/lib/brand";

const SHOTS = [
  { id: "1", title: "Board Room overview", desc: "Full map + Overview tab" },
  { id: "2", title: "BER+ Board Room framing", desc: "Left panel — problem, benchmarks, value" },
  { id: "3", title: "Mitglieder & matching", desc: "Member list + OSM link counts" },
  { id: "4", title: "OSM Intel / visibility", desc: "Land & infrastructure layers" },
  { id: "5", title: "Member path panel", desc: "Right panel — per-member steps" },
  {
    id: "6",
    title: "Match review popup",
    desc: "Matching map → member focus → click OSM node → fig06-matching-review-popup.png"
  },
  {
    id: "7",
    title: "Giant matching map",
    desc: "Header Matching map → member chip (e.g. Taurecon) → fig07-giant-matching-map.png"
  },
  {
    id: "8",
    title: "Mobile Board Room map",
    desc: "390×844 — bottom nav + Explore sheet → fig08-mobile-war-room.png"
  }
] as const;

function CaptureContent() {
  const params = useSearchParams();
  const shot = params.get("shot") ?? "index";

  if (shot === "index") {
    return (
      <div className="min-h-screen bg-ink-950 p-8 text-white">
        <h1 className="text-xl font-semibold">Presentation screenshots</h1>
        <p className="mt-2 max-w-xl text-sm text-white/70">
          Run <code className="rounded bg-white/10 px-1">npm run dev</code> (port 3001), open each link, capture at
          1920×1080 (or 1600×900). Save PNGs to{" "}
          <code className="rounded bg-white/10 px-1">docs/presentation/figures/</code>.
        </p>
        <ul className="mt-6 space-y-2">
          {SHOTS.map((s) => (
            <li key={s.id}>
              <Link
                href={`/capture?shot=${s.id}`}
                className="text-sky-300 hover:underline"
              >
                Shot {s.id}: {s.title}
              </Link>
              <span className="ml-2 text-sm text-white/50">— {s.desc}</span>
            </li>
          ))}
        </ul>
        <Link href="/" className="mt-8 inline-block text-sm text-white/60 hover:text-white">
          ← Back to {BRAND.mapLabel}
        </Link>
      </div>
    );
  }

  if (shot === "1") {
    return (
      <div className="relative h-[100dvh] w-full bg-ink-950">
        <MapWorkspace />
        <div className="pointer-events-none absolute bottom-3 left-3 z-[30] rounded bg-black/70 px-2 py-1 text-[10px] text-white/80">
          Fig. 1 — {BRAND.name} (overview)
        </div>
      </div>
    );
  }

  if (shot === "2") {
    return (
      <div className="min-h-screen bg-ink-950 p-6">
        <div className="mb-4 text-[10px] text-white/50">Fig. 2 — Strategic options for BER+ (June 12)</div>
        <div className="floating-panel max-w-md p-4">
          <BerPlusValuePanel onGoToTab={() => {}} selectedMemberCategory="developer" />
        </div>
      </div>
    );
  }

  if (shot === "3") {
    const sample = MITGLIEDER.slice(0, 8);
    return (
      <div className="min-h-screen bg-ink-950 p-6">
        <div className="mb-4 text-[10px] text-white/50">Fig. 3 — Mitglieder matching & OSM links</div>
        <div className="floating-panel max-w-sm p-4">
          <div className="text-sm font-semibold">Mitglieder</div>
          <p className="mt-1 text-xs text-white/60">Matching companies to corridor assets</p>
          <ul className="mt-3 space-y-2">
            {sample.map((m) => (
              <li key={m.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
                {m.shortName}
                <span className="block text-xs text-amber-200/80">{m.corridorRole}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (shot === "4") {
    return (
      <div className="relative h-[100dvh] w-full bg-ink-950">
        <MapWorkspace />
        <div className="pointer-events-none absolute bottom-3 left-3 z-[30] rounded bg-black/70 px-2 py-1 text-[10px] text-white/80">
          Fig. 4 — OSM Intel: open OSM Intel tab, zoom ≥11 (Schönefeld)
        </div>
        <p className="pointer-events-none absolute bottom-10 left-3 z-[30] max-w-xs text-[10px] text-amber-200/90">
          Before capture: click OSM Intel · wait for layers · zoom to Schönefeld industrial zone
        </p>
      </div>
    );
  }

  if (shot === "5") {
    const buwog = MITGLIEDER.find((m) => m.id === "buwog")!;
    return (
      <div className="min-h-screen bg-ink-950 p-6">
        <div className="mb-4 text-[10px] text-white/50">Fig. 5 — Member path (example: BUWOG)</div>
        <div className="floating-panel max-w-sm p-4">
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-950/25 p-3">
            <div className="text-xs font-bold text-emerald-300">Your path · {buwog.shortName}</div>
            <p className="mt-1 text-sm text-white/80">{buwog.corridorRole}</p>
            <p className="mt-2 text-xs text-white/65">{buwog.intro.slice(0, 200)}…</p>
          </div>
          <ul className="mt-3 space-y-2 text-xs text-white/70">
            {COORDINATION_THEMES.map((t) => (
              <li key={t.id}>
                <strong className="text-amber-100">{t.title}</strong> — {t.firstStep}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (shot === "6" || shot === "7" || shot === "8") {
    const fig =
      shot === "6"
        ? "fig06-matching-review-popup.png"
        : shot === "7"
          ? "fig07-giant-matching-map.png"
          : "fig08-mobile-war-room.png";
    const steps =
      shot === "6"
        ? [
            `Open ${BRAND.mapLabel} → switch to Matching map (header).`,
            "Pick a Mitglied chip (e.g. GSG) and wait for the graph.",
            "Click a yellow OSM node → capture the Match review · geo modal."
          ]
        : shot === "7"
          ? [
            "Matching map → Overview or member focus.",
            "Select a member (e.g. Taurecon) for the fan layout.",
            "Capture at 1920×1080 → save as fig07."
          ]
          : [
              "DevTools device mode ~390×844 or run npm run presentation:screenshots.",
              "Open Explore bottom tab so the sheet is visible over the map.",
              "Save as fig08-mobile-war-room.png."
            ];
    return (
      <div className="min-h-screen bg-ink-950 p-8 text-white">
        <h1 className="text-lg font-semibold">Shot {shot} → {fig}</h1>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-white/80">
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <Link href="/" className="mt-8 inline-block rounded-lg bg-sky-500/25 px-4 py-2 text-sm text-sky-100 hover:bg-sky-500/40">
          Open {BRAND.mapLabel}
        </Link>
        <Link href="/capture" className="ml-4 mt-8 inline-block text-sm text-white/60 hover:text-white">
          ← All shots
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 text-white">
      Unknown shot. <Link href="/capture">Back to index</Link>
    </div>
  );
}

export default function CapturePage() {
  return (
    <Suspense fallback={<div className="bg-ink-950 p-8 text-white">Loading…</div>}>
      <CaptureContent />
    </Suspense>
  );
}
