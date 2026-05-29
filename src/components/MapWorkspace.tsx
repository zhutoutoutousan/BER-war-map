"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { WarRoomMap } from "@/components/WarRoomMap";
import { MembersPanel } from "@/components/MembersPanel";
import { MemberDetailPanel } from "@/components/MemberDetailPanel";
import { BerPlusValuePanel, type LeftTab } from "@/components/BerPlusValuePanel";
import { BriefingPanel } from "@/components/BriefingPanel";
import { JunqingchuPanel } from "@/components/JunqingchuPanel";
import { ProgrammePanel } from "@/components/ProgrammePanel";
import { FloatingPanel } from "@/components/FloatingPanel";
import { CorridorHeader } from "@/components/CorridorHeader";
import { ProgrammePhaseBanner } from "@/components/ProgrammePhaseBanner";
import { TimelineControl } from "@/components/TimelineControl";
import { CctvPanel } from "@/components/CctvPanel";
import { CctvProvider } from "@/context/CctvContext";
import { OsmIntelProvider } from "@/context/OsmIntelContext";
import { ProgrammeProvider } from "@/context/ProgrammeContext";
import { MemberHomePanel } from "@/components/MemberHomePanel";
import { SessionPickerModal } from "@/components/SessionPickerModal";
import { GiantMatchingMap, type WorkspaceViewMode } from "@/components/GiantMatchingMap";
import { BerPlusChatbot } from "@/components/BerPlusChatbot";
import { MapActionsProvider, useMapActions } from "@/context/MapActionsContext";
import { useOsmIntel } from "@/context/OsmIntelContext";
import { UserSessionProvider, useUserSession } from "@/context/UserSessionContext";
import { getMitgliedById } from "@/data/mitglieder";
import type { MemberCategory } from "@/data/mitglieder";
import { CATEGORY_COLORS } from "@/data/mitglieder";
import { useIsMobile } from "@/lib/use-media";

type MobileSheet = null | "explore" | "member";

const LEFT_TAB_TITLES: Record<LeftTab, string> = {
  value: "BER+ Paths",
  foryou: "For you",
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
          <MapWorkspaceWithSession />
        </OsmIntelProvider>
      </CctvProvider>
    </ProgrammeProvider>
  );
}

function MapWorkspaceWithSession() {
  const searchParams = useSearchParams();
  const memberParam = searchParams.get("member");

  return (
    <UserSessionProvider urlMemberId={memberParam}>
      <SessionPickerModal />
      <MapWorkspaceInner />
    </UserSessionProvider>
  );
}

function MapWorkspaceInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const memberParam = searchParams.get("member");
  const { session, sessionReady, isMember, memberId: sessionMemberId, switchUser } = useUserSession();

  const initialTab: LeftTab =
    tabParam === "members" ||
    tabParam === "briefing" ||
    tabParam === "programme" ||
    tabParam === "junqingchu" ||
    tabParam === "value" ||
    tabParam === "foryou"
      ? tabParam
      : memberParam || sessionMemberId
        ? "foryou"
        : "value";

  const [leftTab, setLeftTab] = useState<LeftTab>(initialTab);
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>("geo");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(memberParam);
  const [filterCategory, setFilterCategory] = useState<MemberCategory | "all">("all");
  const selectedMember = selectedMemberId ? getMitgliedById(selectedMemberId) : null;

  const loggedInMemberId = isMember ? sessionMemberId : null;

  useEffect(() => {
    if (
      tabParam === "members" ||
      tabParam === "briefing" ||
      tabParam === "programme" ||
      tabParam === "junqingchu" ||
      tabParam === "value" ||
      tabParam === "foryou"
    ) {
      setLeftTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (memberParam) setSelectedMemberId(memberParam);
  }, [memberParam]);

  useEffect(() => {
    if (!sessionReady || !session) return;
    if (session.role === "member") {
      setSelectedMemberId(session.memberId);
      if (!tabParam) setLeftTab("foryou");
    }
  }, [session, sessionReady, tabParam]);

  return (
    <MapActionsProvider>
      <MapWorkspaceContent
        leftTab={leftTab}
        setLeftTab={setLeftTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedMemberId={selectedMemberId}
        setSelectedMemberId={setSelectedMemberId}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        selectedMember={selectedMember}
        loggedInMemberId={loggedInMemberId}
        session={session}
        switchUser={switchUser}
      />
    </MapActionsProvider>
  );
}

function MapWorkspaceContent({
  leftTab,
  setLeftTab,
  viewMode,
  setViewMode,
  selectedMemberId,
  setSelectedMemberId,
  filterCategory,
  setFilterCategory,
  selectedMember,
  loggedInMemberId,
  session,
  switchUser
}: {
  leftTab: LeftTab;
  setLeftTab: (t: LeftTab) => void;
  viewMode: WorkspaceViewMode;
  setViewMode: (m: WorkspaceViewMode) => void;
  selectedMemberId: string | null;
  setSelectedMemberId: (id: string | null) => void;
  filterCategory: MemberCategory | "all";
  setFilterCategory: (c: MemberCategory | "all") => void;
  selectedMember: ReturnType<typeof getMitgliedById> | null;
  loggedInMemberId: string | null;
  session: ReturnType<typeof useUserSession>["session"];
  switchUser: () => void;
}) {
  const { selectFeature } = useOsmIntel();
  const { focusLandSite, focusMember } = useMapActions();
  const isMobile = useIsMobile();
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null);

  const handleMatchingNode = useCallback(
    (nodeId: string) => {
      if (nodeId.startsWith("member-") || nodeId.startsWith("zone-")) return;

      setViewMode("geo");

      if (nodeId.startsWith("land-")) {
        const siteId = nodeId.replace("land-", "");
        focusLandSite(siteId);
        selectFeature(`curated/${siteId}`);
        setLeftTab("junqingchu");
        return;
      }
      if (nodeId.startsWith("osm-")) {
        selectFeature(nodeId.replace("osm-", ""));
        setLeftTab("junqingchu");
        return;
      }
      if (nodeId === "hub-ber") {
        focusMember("segro");
        setLeftTab("junqingchu");
      }
    },
    [focusLandSite, focusMember, selectFeature, setLeftTab, setSelectedMemberId, setViewMode]
  );

  const geoHidden = viewMode === "matching";

  useEffect(() => {
    if (viewMode === "matching" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (viewMode === "matching") setMobileSheet(null);
  }, [viewMode]);

  const leftPanelTabs = (
    <div className="mb-3 flex flex-wrap gap-1 rounded-lg bg-white/5 p-1">
      {loggedInMemberId ? (
        <TabButton testId="map-tab-foryou" active={leftTab === "foryou"} onClick={() => setLeftTab("foryou")}>
          For you
        </TabButton>
      ) : null}
      <TabButton testId="map-tab-value" active={leftTab === "value"} onClick={() => setLeftTab("value")}>
        BER+ Paths
      </TabButton>
      <TabButton testId="map-tab-members" active={leftTab === "members"} onClick={() => setLeftTab("members")}>
        Mitglieder
      </TabButton>
      <TabButton testId="map-tab-junqingchu" active={leftTab === "junqingchu"} onClick={() => setLeftTab("junqingchu")}>
        OSM Intel
      </TabButton>
      <TabButton testId="map-tab-programme" active={leftTab === "programme"} onClick={() => setLeftTab("programme")}>
        Programme
      </TabButton>
      <TabButton testId="map-tab-briefing" active={leftTab === "briefing"} onClick={() => setLeftTab("briefing")}>
        Briefing
      </TabButton>
    </div>
  );

  const leftPanelBody =
    leftTab === "foryou" && loggedInMemberId ? (
      <MemberHomePanel
        memberId={loggedInMemberId}
        onGoToTab={setLeftTab}
        onSelectMember={setSelectedMemberId}
        onOpenGiantMap={() => setViewMode("matching")}
      />
    ) : leftTab === "value" ? (
      <BerPlusValuePanel
        onGoToTab={setLeftTab}
        selectedMemberCategory={selectedMember?.category ?? null}
        selectedMemberId={loggedInMemberId ?? selectedMemberId}
      />
    ) : leftTab === "members" ? (
      <MembersPanel
        selectedId={selectedMemberId}
        onSelect={setSelectedMemberId}
        filterCategory={filterCategory}
        onFilterCategory={setFilterCategory}
      />
    ) : leftTab === "briefing" ? (
      <BriefingPanel onGoToTab={setLeftTab} />
    ) : leftTab === "programme" ? (
      <ProgrammePanel />
    ) : (
      <JunqingchuPanel />
    );

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-ink-950"
      data-scene={`${viewMode}:${leftTab}${selectedMemberId ? `:${selectedMemberId}` : ""}`}
    >
      <WarRoomMap
        selectedMemberId={selectedMemberId}
        onSelectMember={setSelectedMemberId}
        filterCategory={filterCategory}
        className={geoHidden ? "invisible pointer-events-none" : undefined}
      />

      {viewMode === "matching" ? (
        <GiantMatchingMap
          defaultMemberId={loggedInMemberId ?? selectedMemberId}
          onSelectNode={handleMatchingNode}
          onSwitchToGeo={() => setViewMode("geo")}
        />
      ) : null}

      {!geoHidden ? <ProgrammePhaseBanner /> : null}

      {!geoHidden ? (
      <div
        data-testid="capture-vignette"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 45%, transparent 40%, rgba(6,8,12,0.55) 100%)"
        }}
      />
      ) : null}

      <div
        className={`pointer-events-none absolute inset-0 z-10 flex flex-col gap-2 p-2 sm:p-3 ${
          geoHidden ? "invisible pointer-events-none" : ""
        } ${isMobile ? "pb-[calc(3.75rem+env(safe-area-inset-bottom))]" : ""}`}
      >
        <div className="pointer-events-auto shrink-0 safe-top" data-testid="showcase-header">
          <CorridorHeader
            compact
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sessionLabel={
              loggedInMemberId
                ? getMitgliedById(loggedInMemberId)?.shortName ?? null
                : session?.role === "guest"
                  ? "Guest"
                  : null
            }
            onSwitchUser={switchUser}
          />
        </div>

        <div className="flex min-h-0 flex-1 items-stretch justify-between gap-2">
          <FloatingPanel
            testId="showcase-panel-left"
            title={LEFT_TAB_TITLES[leftTab]}
            side="left"
            mobileSheet={isMobile}
            mobileOpen={mobileSheet === "explore"}
            onMobileClose={() => setMobileSheet(null)}
          >
            {leftPanelTabs}
            {leftPanelBody}
          </FloatingPanel>

          <FloatingPanel
            testId="showcase-panel-right"
            title="Member path"
            side="right"
            defaultCollapsed={false}
            mobileSheet={isMobile}
            mobileOpen={mobileSheet === "member"}
            onMobileClose={() => setMobileSheet(null)}
          >
            <MemberDetailPanel
              selectedId={selectedMemberId}
              onGoToTab={setLeftTab}
              viewerMemberId={loggedInMemberId}
            />
          </FloatingPanel>
        </div>

        <div data-testid="capture-chrome" className="pointer-events-none relative flex shrink-0 flex-col gap-2">
          <div className="pointer-events-auto mx-auto w-full max-w-xl px-1">
            <div className="floating-panel px-3 py-2.5">
              <TimelineControl compact />
            </div>
          </div>

          <div className="relative hidden flex-wrap items-end justify-between gap-2 md:flex">
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
            <div className="floating-panel pointer-events-auto flex flex-wrap gap-1.5 p-1.5">
              <NavLink href="/briefing">Briefing</NavLink>
              <NavLink href="/mitglieder">Mitglieder</NavLink>
              <NavLink href="/programme">Programme</NavLink>
            </div>
          </div>
          </div>
        </div>
      </div>

      {isMobile ? (
        <nav className="mobile-nav-bar md:hidden" aria-label="War room navigation">
          <MobileNavButton
            active={viewMode === "geo" && mobileSheet === null}
            onClick={() => {
              setViewMode("geo");
              setMobileSheet(null);
            }}
            label="Map"
            testId="mobile-nav-map"
          />
          <MobileNavButton
            active={mobileSheet === "explore"}
            onClick={() => {
              setViewMode("geo");
              setMobileSheet("explore");
            }}
            label="Explore"
            testId="mobile-nav-explore"
          />
          <MobileNavButton
            active={mobileSheet === "member"}
            onClick={() => {
              setViewMode("geo");
              setMobileSheet("member");
            }}
            label="Member"
            testId="mobile-nav-member"
          />
          <MobileNavButton
            active={viewMode === "matching"}
            onClick={() => {
              setViewMode("matching");
              setMobileSheet(null);
            }}
            label="Match"
            testId="mobile-nav-match"
          />
        </nav>
      ) : null}

      <BerPlusChatbot memberId={loggedInMemberId} mobileNavOffset={isMobile} />
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
  children,
  testId
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`min-h-[44px] flex-1 rounded-md px-2 py-2 text-xs font-medium transition touch-manipulation ${
        active ? "bg-white/12 text-white" : "text-white/60 hover:text-white/80"
      }`}
    >
      {children}
    </button>
  );
}

function MobileNavButton({
  active,
  onClick,
  label,
  testId
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium touch-manipulation ${
        active ? "text-sky-200" : "text-white/50"
      }`}
    >
      <span className={`h-1 w-6 rounded-full ${active ? "bg-sky-400" : "bg-transparent"}`} aria-hidden />
      {label}
    </button>
  );
}
