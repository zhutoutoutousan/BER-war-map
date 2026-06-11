import Link from "next/link";
import { BRAND } from "@/lib/brand";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  MITGLIEDER,
  type MemberCategory
} from "@/data/mitglieder";

export default function MitgliederPage() {
  const byCategory = groupByCategory(MITGLIEDER);

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-4 px-4 py-4">
        <div className="panel flex flex-col gap-2 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs tracking-wide text-white/60">IG Umfeld BER e.V. (BER+)</div>
            <div className="text-lg font-semibold text-white">Mitglieder directory</div>
            <div className="text-sm text-white/65">
              {MITGLIEDER.length} members — synced with the strategic map. Data curated from{" "}
              <a href="https://www.ber-plus.de/" className="text-sky-200 hover:text-sky-100" target="_blank" rel="noreferrer">
                ber-plus.de
              </a>
              .
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15">
              {BRAND.mapLabel}
            </Link>
            <Link
              href="/api/mitglieder"
              className="rounded-lg bg-sky-400/15 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-400/20"
            >
              JSON API
            </Link>
          </div>
        </div>

        {(Object.keys(byCategory) as MemberCategory[]).map((cat) => (
          <section key={cat} className="panel p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
              {CATEGORY_LABELS[cat]}
            </h2>
            <ul className="mt-3 divide-y divide-white/10">
              {byCategory[cat].map((m) => (
                <li key={m.id} className="py-4 first:pt-0">
                  <div className="font-medium text-white">{m.name}</div>
                  <div className="mt-1 text-sm text-sky-100/80">{m.corridorRole}</div>
                  <p className="mt-2 text-sm text-white/75">{m.intro}</p>
                  {m.quote ? (
                    <blockquote className="mt-3 border-l-2 border-white/20 pl-3 text-sm italic text-white/70">
                      &ldquo;{m.quote}&rdquo;
                      {m.quoteAuthor ? <footer className="mt-1 not-italic text-xs text-white/50">— {m.quoteAuthor}</footer> : null}
                    </blockquote>
                  ) : null}
                  <a href={m.website} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-sky-200">
                    {m.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} →
                  </a>
                  {m.projectUrl ? (
                    <a
                      href={m.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-3 mt-2 inline-block text-sm text-white/55 hover:text-white/75"
                    >
                      Project →
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function groupByCategory(members: typeof MITGLIEDER) {
  const out = {} as Record<MemberCategory, typeof MITGLIEDER>;
  for (const m of members) {
    (out[m.category] ??= []).push(m);
  }
  return out;
}
