import Link from "next/link";
import { ProgrammeProvider } from "@/context/ProgrammeContext";
import { ProgrammePanel } from "@/components/ProgrammePanel";

export default function ProgrammePage() {
  return (
    <main className="min-h-[100dvh] bg-ink-950 p-4 sm:p-6">
      <ProgrammeProvider>
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-white">Programme control</h1>
              <p className="mt-1 text-sm text-white/55">
                Contracts, milestones, and delivery phases for the BER+ corridor.
              </p>
            </div>
            <Link
              href="/"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80 hover:bg-white/10"
            >
              ← War room map
            </Link>
          </div>

          <div className="panel p-4">
            <ProgrammePanel />
          </div>
        </div>
      </ProgrammeProvider>
    </main>
  );
}
