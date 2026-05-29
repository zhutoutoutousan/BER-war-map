import { Suspense } from "react";
import { MapWorkspace } from "@/components/MapWorkspace";

export default function Home() {
  return (
    <main className="h-[100dvh] w-full overflow-hidden">
      <Suspense fallback={<div className="flex h-full items-center justify-center bg-ink-950 text-white/60">Loading map…</div>}>
        <MapWorkspace />
      </Suspense>
    </main>
  );
}
