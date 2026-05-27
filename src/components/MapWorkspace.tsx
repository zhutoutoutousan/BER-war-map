"use client";

import Link from "next/link";
import { useState } from "react";
import { WarRoomMap } from "@/components/WarRoomMap";
import { MembersPanel } from "@/components/MembersPanel";
import { MemberDetailPanel } from "@/components/MemberDetailPanel";
import { BriefingPanel } from "@/components/BriefingPanel";
import { JunqingchuPanel } from "@/components/JunqingchuPanel";
import { ProgrammePanel } from "@/components/ProgrammePanel";
import { FloatingPanel } from "@/components/FloatingPanel";
import { CorridorHeader } from "@/components/CorridorHeader";
import { ProgrammePhaseBanner } from "@/components/ProgrammePhaseBanner";
import { TimelineControl } from "@/components/TimelineControl";
import { IntelligenceTV } from "@/components/IntelligenceTV";
import { CctvPanel } from "@/components/CctvPanel";
import { CctvProvider } from "@/context/CctvContext";
import { OsmIntelProvider } from "@/context/OsmIntelContext";
import { ProgrammeProvider } from "@/context/ProgrammeContext";
import { CATEGORY_COLORS } from "@/data/mitglieder";
import type { MemberCategory } from "@/data/mitglieder";

type LeftTab = "briefing" | "members" | "programme" | "junqingchu";

const LEFT_TAB_TITLES: Record<LeftTab, string> = {
  members: "Mitglieder",
  briefing: "Briefing",
  programme: "Programme",
  junqingchu: "OSM Intel"
};

export function MapWorkspace() {
  return (
    <ProgrammeProvider>
      <CctvProvider>
        <OsmIntelProvider>
          <MapWorkspaceInner />
        </OsmIntelProvider>
      </CctvProvider>
    </ProgrammeProvider>
  );
}

function MapWorkspaceInner() {
  const [leftTab, setLeftTab] = useState<LeftTab>("junqingchu");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<MemberCategory | "all">("all");

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-ink-950">
      <WarRoomMap
        selectedMemberId={selectedMemberId}
        onSelectMember={setSelectedMemberId}
        filterCategory={filterCategory}
      />

      <ProgrammePhaseBanner />

      {/* Vignette for war-room depth */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 45%, transparent 40%, rgba(6,8,12,0.55) 100%)"
        }}
      />

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-2 p-2 sm:p-3">
        <div className="pointer-events-auto shrink-0">
          <CorridorHeader compact />
        </div>

        <div className="flex min-h-0 flex-1 items-stretch justify-between gap-2">
          <FloatingPanel title={LEFT_TAB_TITLES[leftTab]} side="left">
            <div className="mb-3 flex flex-wrap gap-1 rounded-lg bg-white/5 p-1">
              <TabButton active={leftTab === "members"} onClick={() => setLeftTab("members")}>
                Mitglieder
              </TabButton>
              <TabButton active={leftTab === "briefing"} onClick={() => setLeftTab("briefing")}>
                Briefing
              </TabButton>
              <TabButton active={leftTab === "programme"} onClick={() => setLeftTab("programme")}>
                Programme
              </TabButton>
              <TabButton active={leftTab === "junqingchu"} onClick={() => setLeftTab("junqingchu")}>
                OSM Intel
              </TabButton>
            </div>
            {leftTab === "members" ? (
              <MembersPanel
                selectedId={selectedMemberId}
                onSelect={setSelectedMemberId}
                filterCategory={filterCategory}
                onFilterCategory={setFilterCategory}
              />
            ) : leftTab === "briefing" ? (
              <BriefingPanel />
            ) : leftTab === "programme" ? (
              <ProgrammePanel />
            ) : (
              <JunqingchuPanel />
            )}
          </FloatingPanel>

          <FloatingPanel title="Profile" side="right" defaultCollapsed={false}>
            <MemberDetailPanel selectedId={selectedMemberId} />
          </FloatingPanel>
        </div>

        <div className="pointer-events-none relative flex shrink-0 flex-col gap-2">
          <div className="pointer-events-auto mx-auto w-full max-w-xl px-1">
            <div className="floating-panel px-3 py-2">
              <TimelineControl compact />
            </div>
          </div>

          <div className="relative flex flex-wrap items-end justify-between gap-2">
          <div className="absolute bottom-0 left-0 z-20 flex flex-col items-start gap-2">
            <CctvPanel />
            <div className="floating-panel pointer-events-auto flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-[11px] text-white/80">
            <LegendDot color="#38bdf8" label="BER+ Corridor" glow />
            <span className="text-white/20">|</span>
            <LegendDot color="#0ea5e9" label="BER" glow />
            <span className="text-white/20">|</span>
            <LegendDot color="#10b981" label="Pilot-1" />
            <span className="text-white/20">|</span>
            <LegendDot color={CATEGORY_COLORS.developer} label="Mitglieder" />
            <span className="text-white/20">|</span>
            <LegendDot color="#f472b6" label="CCTV" />
            <span className="text-white/20">|</span>
            <LegendDot color="#34d399" label="Land" />
            <LegendDot color="#f59e0b" label="Industry" />
            <LegendDot color="#a3e635" label="Transport" />
            <span className="text-white/20">|</span>
            <LegendDot color="#fbbf24" label="Member zones" />
            <LegendDot color="#f59e0b" label="Member OSM" />
            </div>
          </div>

          <div className="absolute bottom-0 right-0 z-20 flex flex-col items-end gap-2">
            <IntelligenceTV />
            <div className="floating-panel pointer-events-auto flex flex-wrap gap-1.5 p-1.5">
              <NavLink href="/briefing">Briefing</NavLink>
              <NavLink href="/mitglieder">Mitglieder</NavLink>
              <NavLink href="/programme">Programme</NavLink>
              <NavLink href="/news" accent>
                Intel
              </NavLink>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label, glow }: { color: string; label: string; glow?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: glow ? `0 0 14px ${color}` : `0 0 8px ${color}99`
        }}
      />
      {label}
    </span>
  );
}

function NavLink({
  href,
  children,
  accent
}: {
  href: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
        accent
          ? "bg-emerald-400/20 text-emerald-100 hover:bg-emerald-400/30"
          : "bg-white/8 text-white/85 hover:bg-white/12"
      }`}
    >
      {children}
    </Link>
  );
}

function TabButton({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
        active ? "bg-white/12 text-white" : "text-white/60 hover:text-white/80"
      }`}
    >
      {children}
    </button>
  );
}
