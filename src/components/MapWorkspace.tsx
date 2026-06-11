"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WarRoomMap } from "@/components/WarRoomMap";
import { MembersPanel } from "@/components/MembersPanel";
import { MemberDetailPanel } from "@/components/MemberDetailPanel";
import { BerPlusValuePanel, type LeftTab } from "@/components/BerPlusValuePanel";
import { BriefingPanel } from "@/components/BriefingPanel";
import { JunqingchuPanel } from "@/components/JunqingchuPanel";
import { ProgrammePanel } from "@/components/ProgrammePanel";
import { FloatingPanel } from "@/components/FloatingPanel";
import { MobileBottomSheet } from "@/components/MobileBottomSheet";
import { MapRevealHint } from "@/components/MapRevealHint";
import { CorridorHeader } from "@/components/CorridorHeader.next";
import { ProgrammePhaseBanner } from "@/components/ProgrammePhaseBanner";
import { TimelineControl } from "@/components/TimelineControl";
import { BenchmarkTeleportBar } from "@/components/BenchmarkTeleportBar";
import { CctvProvider } from "@/context/CctvContext";
import { OsmIntelProvider } from "@/context/OsmIntelContext";
import { ProgrammeProvider } from "@/context/ProgrammeContext";
import { MemberHomePanel } from "@/components/MemberHomePanel";
import { SessionPickerModal } from "@/components/SessionPickerModal";
import { ProblemCameoGate } from "@/components/ProblemCameoGate";
import { GuidedTourOverlay } from "@/components/GuidedTourOverlay";
import { GuidedTourProvider } from "@/context/GuidedTourContext";
import type { TourAction } from "@/data/guided-tour";
import { GiantMatchingMap, type WorkspaceViewMode } from "@/components/GiantMatchingMap";
import {
  BENCHMARK_CATEGORIES,
  BENCHMARK_CATEGORY_COLORS,
  benchmarkOsmBbox,
  getBenchmarkById,
  type BenchmarkCategory
} from "@/data/benchmarks";
import { BerPlusChatbot } from "@/components/BerPlusChatbot";
import { TELEPORT_SITES, getMapRegion, type MapRegionId } from "@/lib/map-regions";
import { emptyOsmIntelPayload, type OsmIntelPayload } from "@/lib/osm-schoenefeld";
import { IntelligenceTV } from "@/components/IntelligenceTV";
import { PersonaViewBanner } from "@/components/PersonaViewBanner";
import { PersonaTabBar, TAB_LABELS } from "@/components/PersonaTabBar";
import { MapActionsProvider, useMapActions } from "@/context/MapActionsContext";
import { useOsmIntel } from "@/context/OsmIntelContext";
import { CollaborativeInventoryPanel } from "@/components/CollaborativeInventoryPanel";
import {
  CollaborativeInventoryProvider,
  useCollaborativeInventory
} from "@/context/CollaborativeInventoryContext";
import { UserSessionProvider, useUserSession } from "@/context/UserSessionContext";
import { getMitgliedById } from "@/data/mitglieder";
import type { MemberCategory } from "@/data/mitglieder";
import { CATEGORY_COLORS } from "@/data/mitglieder";
import { useIsMobile } from "@/lib/use-media";
import { labelForSelectedFeature } from "@/lib/map-reveal-label";
import { GUEST_PERSONAS, personaPanelTitle } from "@/lib/guest-personas";
import { useProgramme } from "@/context/ProgrammeContext";
import { phaseForDate, PHASES } from "@/data/programme";

type MobileSheet = null | "explore" | "member";

const LEFT_TAB_TITLES: Record<LeftTab, string> = {
  value: TAB_LABELS.value,
  foryou: TAB_LABELS.foryou,
  members: TAB_LABELS.members,
  briefing: TAB_LABELS.briefing,
  programme: TAB_LABELS.programme,
  junqingchu: TAB_LABELS.junqingchu,
  inventory: TAB_LABELS.inventory
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
      <CollaborativeInventoryProvider>
        <SessionPickerModal />
        <CameoGateHost />
        <MapWorkspaceInner />
      </CollaborativeInventoryProvider>
    </UserSessionProvider>
  );
}

function CameoGateHost() {
  const { session, boardRoomUnlocked, completeCameo } = useUserSession();
  if (!session || boardRoomUnlocked) return null;
  return <ProblemCameoGate onComplete={completeCameo} />;
}

function MapWorkspaceInner() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const memberParam = searchParams.get("member");
  const { session, sessionReady, isMember, memberId: sessionMemberId, switchUser, guestPersona, boardRoomUnlocked } = useUserSession();

  const initialTab: LeftTab =
    tabParam === "members" ||
    tabParam === "briefing" ||
    tabParam === "programme" ||
    tabParam === "junqingchu" ||
    tabParam === "inventory" ||
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
      tabParam === "inventory" ||
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
        guestPersona={guestPersona}
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
  guestPersona,
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
  guestPersona: ReturnType<typeof useUserSession>["guestPersona"];
  switchUser: () => void;
}) {
  const { boardRoomUnlocked, showGuidedTour, completeGuidedTour, skipGuidedTour, replayGuidedTour, tourReplayKey } =
    useUserSession();
  const {
    selectFeature,
    selectedFeatureId,
    data: osmData,
    loadBenchmarkRegion,
    reloadBerCorridor,
    activeRegionId,
    loading: osmLoading
  } = useOsmIntel();
  const { focusLandSite, focusMember } = useMapActions();
  const [selectedBenchmarkId, setSelectedBenchmarkId] = useState<string | null>(null);
  const [activeRegion, setActiveRegion] = useState<MapRegionId>("ber-corridor");
  const [splitCompare, setSplitCompare] = useState(false);
  const [compareRegion, setCompareRegion] = useState<MapRegionId>(
    TELEPORT_SITES.find((s) => s.id !== "ber-corridor")?.id ?? "schiphol-aaa"
  );
  const [compareOsm, setCompareOsm] = useState<OsmIntelPayload | null>(null);
  const [timelineChromeOpen, setTimelineChromeOpen] = useState(false);
  const [mapLegendOpen, setMapLegendOpen] = useState(false);
  const [teleportBarOpen, setTeleportBarOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const { stats: collabStats } = useCollaborativeInventory();
  const isMobile = useIsMobile();
  const [mobileSheet, setMobileSheet] = useState<MobileSheet>(null);
  const [mapRevealHint, setMapRevealHint] = useState<string | null>(null);
  const [personaPulse, setPersonaPulse] = useState(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prevFeatureRef = useRef<string | null>(null);
  const personaAppliedRef = useRef<string | null>(null);

  const showMapRevealHint = useCallback((message: string) => {
    setMapRevealHint(message);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setMapRevealHint(null), 4500);
  }, []);

  const revealMapOnMobile = useCallback(() => {
    if (isMobile) setMobileSheet(null);
  }, [isMobile]);

  const openAssetMgmt = useCallback(() => {
    setViewMode("geo");
    setLeftTab("inventory");
    setLeftPanelOpen(true);
    if (isMobile) setMobileSheet("explore");
  }, [isMobile, setLeftTab, setViewMode]);

  const handleGoToTab = useCallback(
    (tab: LeftTab) => {
      if (tab === "inventory") {
        openAssetMgmt();
        return;
      }
      setLeftTab(tab);
    },
    [openAssetMgmt, setLeftTab]
  );

  useEffect(() => {
    if (!isMobile || !selectedFeatureId || !mobileSheet) {
      prevFeatureRef.current = selectedFeatureId;
      return;
    }
    if (prevFeatureRef.current === selectedFeatureId) return;
    prevFeatureRef.current = selectedFeatureId;
    revealMapOnMobile();
    showMapRevealHint(`On map · ${labelForSelectedFeature(selectedFeatureId, osmData)}`);
  }, [selectedFeatureId, isMobile, osmData, mobileSheet, revealMapOnMobile, showMapRevealHint]);

  const handleSelectMember = useCallback(
    (id: string | null) => {
      setSelectedMemberId(id);
      if (!isMobile || !id || !mobileSheet) return;
      revealMapOnMobile();
      const m = getMitgliedById(id);
      showMapRevealHint(m ? `On map · ${m.shortName}` : "On map");
    },
    [isMobile, mobileSheet, revealMapOnMobile, showMapRevealHint, setSelectedMemberId]
  );

  const handleMatchingNode = useCallback(
    (nodeId: string) => {
      setViewMode("geo");

      if (nodeId.startsWith("member-")) {
        const id = nodeId.replace("member-", "");
        setSelectedMemberId(id);
        focusMember(id);
        setLeftTab(loggedInMemberId === id ? "foryou" : "members");
        return;
      }

      if (nodeId.startsWith("zone-")) return;

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
    [focusLandSite, focusMember, selectFeature, setLeftTab, setViewMode, loggedInMemberId, setSelectedMemberId]
  );

  const geoHidden = viewMode === "matching";
  const splitActive = splitCompare;

  const compareOsmForMap = useMemo(() => {
    if (compareOsm) return compareOsm;
    if (!splitActive || compareRegion === "ber-corridor") return null;
    const b = getBenchmarkById(compareRegion);
    if (!b) return null;
    return emptyOsmIntelPayload(benchmarkOsmBbox(b), b.name);
  }, [compareOsm, splitActive, compareRegion]);

  const teleportTo = useCallback(
    (id: MapRegionId) => {
      if (splitActive && id !== "ber-corridor") {
        setCompareRegion(id);
        return;
      }
      setActiveRegion(id);
      setViewMode("geo");
      if (id === "ber-corridor") {
        setSelectedBenchmarkId(null);
        void reloadBerCorridor();
      } else {
        setSelectedBenchmarkId(id);
        void loadBenchmarkRegion(id);
      }
      if (isMobile) setMobileSheet(null);
    },
    [splitActive, loadBenchmarkRegion, reloadBerCorridor, isMobile, setViewMode]
  );

  const handleToggleSplit = useCallback(() => {
    setSplitCompare((prev) => {
      const next = !prev;
      if (next) {
        setActiveRegion("ber-corridor");
        setSelectedBenchmarkId(null);
        void reloadBerCorridor();
      }
      return next;
    });
  }, [reloadBerCorridor]);

  useEffect(() => {
    if (!splitActive || compareRegion === "ber-corridor") {
      setCompareOsm(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/osm/benchmark/${encodeURIComponent(compareRegion)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((payload: OsmIntelPayload) => {
        if (!cancelled) setCompareOsm(payload);
      })
      .catch(() => {
        if (!cancelled) setCompareOsm(null);
      });
    return () => {
      cancelled = true;
    };
  }, [splitActive, compareRegion]);

  const handleSelectBenchmark = useCallback(
    (id: string | null) => {
      if (id) teleportTo(id as MapRegionId);
      // null = panel dismiss only — keep current locked region
    },
    [teleportTo]
  );

  const handleShowBenchmarkOnMap = useCallback(
    (id: string) => {
      teleportTo(id as MapRegionId);
      const b = getBenchmarkById(id);
      showMapRevealHint(`On map · ${b?.name ?? id} · loading OSM intel…`);
    },
    [teleportTo, showMapRevealHint]
  );

  useEffect(() => {
    if (viewMode === "matching" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (viewMode === "matching") setMobileSheet(null);
  }, [viewMode]);

  useEffect(() => {
    if (!session || session.role !== "guest" || !guestPersona || loggedInMemberId) return;
    const key = `guest:${guestPersona}`;
    if (personaAppliedRef.current === key) return;
    personaAppliedRef.current = key;
    const config = GUEST_PERSONAS[guestPersona];
    setFilterCategory(config.filterCategory);
    setLeftTab(config.defaultTab);
    if (config.demoMemberId) setSelectedMemberId(config.demoMemberId);
    setPersonaPulse(true);
    const pulseTimer = setTimeout(() => setPersonaPulse(false), 4000);
    return () => clearTimeout(pulseTimer);
  }, [
    session,
    guestPersona,
    loggedInMemberId,
    isMobile,
    setFilterCategory,
    setLeftTab,
    setSelectedMemberId
  ]);

  useEffect(() => {
    if (session?.role === "member") personaAppliedRef.current = null;
  }, [session]);

  const showGuestPersona = session?.role === "guest" && guestPersona;
  const personaConfig = guestPersona ? GUEST_PERSONAS[guestPersona] : null;

  const applyTourAction = useCallback(
    (action: TourAction) => {
      if (action.viewMode) setViewMode(action.viewMode);
      else if (action.tab) setViewMode("geo");

      if (action.openLeftPanel === false) {
        setLeftPanelOpen(false);
        if (isMobile) setMobileSheet(null);
      } else if (action.openLeftPanel === true) {
        setLeftPanelOpen(true);
        if (isMobile) setMobileSheet("explore");
      }

      if (action.filterCategory !== undefined) setFilterCategory(action.filterCategory);

      if (action.tab) {
        if (action.tab === "inventory") openAssetMgmt();
        else setLeftTab(action.tab);
      }

      if (action.memberId) {
        setSelectedMemberId(action.memberId);
        focusMember(action.memberId);
      }

      if (action.landSiteId) {
        focusLandSite(action.landSiteId);
        selectFeature(`curated/${action.landSiteId}`);
      }
    },
    [
      focusLandSite,
      focusMember,
      isMobile,
      openAssetMgmt,
      selectFeature,
      setFilterCategory,
      setLeftPanelOpen,
      setLeftTab,
      setMobileSheet,
      setSelectedMemberId,
      setViewMode
    ]
  );

  const personaBanner =
    guestPersona && session?.role === "guest" ? (
      <PersonaViewBanner
        persona={guestPersona}
        pulse={personaPulse}
        activeTab={leftTab}
        onGoToTab={handleGoToTab}
        onSwitchUser={switchUser}
        onOpenMatching={() => setViewMode("matching")}
      />
    ) : null;

  const leftPanelTabs = (
    <PersonaTabBar
      leftTab={leftTab}
      onSelect={setLeftTab}
      guestPersona={guestPersona}
      showForYou={!!loggedInMemberId}
    />
  );

  const leftPanelBody =
    leftTab === "foryou" && loggedInMemberId ? (
      <MemberHomePanel
        memberId={loggedInMemberId}
        onGoToTab={handleGoToTab}
        onSelectMember={handleSelectMember}
        onOpenGiantMap={() => setViewMode("matching")}
      />
    ) : leftTab === "value" ? (
      <BerPlusValuePanel
        onGoToTab={handleGoToTab}
        selectedMemberCategory={selectedMember?.category ?? null}
        selectedMemberId={loggedInMemberId ?? selectedMemberId}
        guestPersona={guestPersona}
        selectedBenchmarkId={selectedBenchmarkId}
        onSelectBenchmark={handleSelectBenchmark}
        onShowBenchmarkOnMap={handleShowBenchmarkOnMap}
        osmFeatureCount={
          activeRegion === "ber-corridor" && activeRegionId === null
            ? osmData?.geojson.features.length
            : activeRegion !== "ber-corridor" && activeRegionId === activeRegion
              ? osmData?.geojson.features.length
              : undefined
        }
        osmLoading={
          osmLoading &&
          ((activeRegion === "ber-corridor" && activeRegionId === null) ||
            activeRegionId === activeRegion)
        }
        onOpenMatching={() => setViewMode("matching")}
      />
    ) : leftTab === "members" ? (
      <MembersPanel
        selectedId={selectedMemberId}
        onSelect={handleSelectMember}
        filterCategory={filterCategory}
        onFilterCategory={setFilterCategory}
        guestPersona={guestPersona}
      />
    ) : leftTab === "briefing" ? (
      <BriefingPanel onGoToTab={handleGoToTab} />
    ) : leftTab === "programme" ? (
      <ProgrammePanel />
    ) : leftTab === "inventory" ? (
      <CollaborativeInventoryPanel
        onFocusLandSite={focusLandSite}
        onFocusMember={focusMember}
        onGoToOsmIntel={() => setLeftTab("junqingchu")}
      />
    ) : (
      <JunqingchuPanel onGoToCollabDemo={openAssetMgmt} />
    );

  return (
    <GuidedTourProvider applyTourAction={applyTourAction}>
    <div
      className={`relative h-[100dvh] w-full overflow-hidden bg-ink-950 ${
        !boardRoomUnlocked ? "pointer-events-none select-none" : ""
      }`}
      data-scene={`${viewMode}:${leftTab}${selectedMemberId ? `:${selectedMemberId}` : ""}`}
      data-persona-ready={session?.role === "guest" && guestPersona ? guestPersona : undefined}
    >
      {!boardRoomUnlocked ? (
        <div className="pointer-events-none absolute inset-0 z-[1] backdrop-blur-[2px] brightness-[0.55]" aria-hidden />
      ) : null}
      {splitActive ? (
        <div
          className={`absolute inset-0 z-0 grid grid-cols-1 md:grid-cols-2 ${
            geoHidden
              ? "invisible pointer-events-none"
              : isMobile && mobileSheet !== null
                ? "pointer-events-none"
                : ""
          }`}
          data-testid="split-compare-maps"
        >
          <div className="relative min-h-0 min-w-0 overflow-hidden" data-testid="split-pane-ber">
            <SplitPaneLabel side="left" label="BER+ corridor" />
            <WarRoomMap
              key="split-ber"
              embedded
              regionId="ber-corridor"
              selectedMemberId={selectedMemberId}
              onSelectMember={handleSelectMember}
              onSelectBenchmark={handleSelectBenchmark}
              showCctv={false}
              registerMapActions
              osmOverlayVisible
              filterCategory={filterCategory}
              interactionLocked={isMobile && mobileSheet !== null}
            />
          </div>
          <div
            className="relative min-h-0 min-w-0 overflow-hidden border-l border-white/15"
            data-testid="split-pane-benchmark"
          >
            <SplitPaneLabel side="right" label={getMapRegion(compareRegion).label} />
            <WarRoomMap
              key={`split-${compareRegion}`}
              embedded
              regionId={compareRegion}
              osmPayloadOverride={compareOsmForMap}
              selectedMemberId={selectedMemberId}
              onSelectMember={handleSelectMember}
              selectedBenchmarkId={compareRegion}
              onSelectBenchmark={handleSelectBenchmark}
              showCctv={false}
              registerMapActions={false}
              osmOverlayVisible
              filterCategory={filterCategory}
              interactionLocked={isMobile && mobileSheet !== null}
            />
          </div>
        </div>
      ) : (
        <WarRoomMap
          regionId={activeRegion}
          selectedMemberId={selectedMemberId}
          onSelectMember={handleSelectMember}
          selectedBenchmarkId={activeRegion === "ber-corridor" ? selectedBenchmarkId : activeRegion}
          onSelectBenchmark={handleSelectBenchmark}
          showCctv={false}
          registerMapActions
          osmOverlayVisible
          filterCategory={filterCategory}
          interactionLocked={isMobile && mobileSheet !== null}
          className={
            geoHidden
              ? "invisible pointer-events-none"
              : isMobile && mobileSheet !== null
                ? "pointer-events-none"
                : undefined
          }
        />
      )}

      {viewMode === "matching" ? (
        <GiantMatchingMap
          defaultMemberId={loggedInMemberId ?? selectedMemberId}
          onOpenInWarRoom={handleMatchingNode}
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
            assetMgmtActive={leftTab === "inventory"}
            onOpenAssetMgmt={openAssetMgmt}
            assetMgmtBadge={`${collabStats.verified}/${collabStats.total}`}
            sessionLabel={
              loggedInMemberId
                ? getMitgliedById(loggedInMemberId)?.shortName ?? null
                : showGuestPersona
                  ? null
                  : session?.role === "guest"
                    ? "Guest"
                    : null
            }
            personaLabel={showGuestPersona ? personaConfig?.shortLabel ?? null : null}
            personaAccentClass={showGuestPersona ? personaConfig?.accent.badge : undefined}
            onSwitchUser={switchUser}
            onOpenGuidedTour={boardRoomUnlocked ? replayGuidedTour : undefined}
            guidedTourActive={showGuidedTour}
          />
        </div>

        <div className="hidden min-h-0 flex-1 items-stretch justify-between gap-2 md:flex">
          <FloatingPanel
            testId="showcase-panel-left"
            title={personaPanelTitle(guestPersona, leftTab, LEFT_TAB_TITLES)}
            side="left"
            defaultCollapsed
            open={leftPanelOpen}
            onOpenChange={setLeftPanelOpen}
          >
            {!isMobile ? personaBanner : null}
            {leftPanelTabs}
            {leftPanelBody}
          </FloatingPanel>

          <FloatingPanel testId="showcase-panel-right" title="Member path" side="right" defaultCollapsed>
            <MemberDetailPanel
              selectedId={selectedMemberId}
              onGoToTab={handleGoToTab}
              viewerMemberId={loggedInMemberId}
            />
          </FloatingPanel>
        </div>

        <div data-testid="capture-chrome" className="pointer-events-none relative flex shrink-0 flex-col gap-2">
          <div className="pointer-events-auto mx-auto w-full max-w-2xl px-1">
            <BenchmarkTeleportBar
              activeId={splitActive ? "ber-corridor" : activeRegion}
              compareId={compareRegion}
              splitCompare={splitCompare}
              open={teleportBarOpen}
              onOpenChange={setTeleportBarOpen}
              onTeleport={teleportTo}
              onCompareRegion={setCompareRegion}
              onToggleSplit={handleToggleSplit}
            />
          </div>
          <div className="pointer-events-auto mx-auto w-full max-w-xl px-1">
            <CollapsibleTimelineChrome open={timelineChromeOpen} onOpenChange={setTimelineChromeOpen} />
          </div>

          <div className="relative hidden flex-wrap items-end justify-between gap-2 md:flex">
          <div className="absolute bottom-0 left-0 z-20 flex flex-col items-start gap-2">
            <CollapsibleMapLegend
              open={mapLegendOpen}
              onOpenChange={setMapLegendOpen}
              showBenchmarkLegend={activeRegion !== "ber-corridor" || splitActive}
            />
          </div>

          <div className="absolute bottom-0 right-0 z-20 flex max-w-[min(420px,calc(100vw-1rem))] flex-col items-end gap-2">
            <IntelligenceTV />
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
        <>
          <MobileBottomSheet
            open={mobileSheet === "explore"}
            title={personaPanelTitle(guestPersona, leftTab, LEFT_TAB_TITLES)}
            testId="showcase-panel-left-mobile"
            onClose={() => setMobileSheet(null)}
          >
            {isMobile ? personaBanner : null}
            {leftPanelTabs}
            {leftPanelBody}
          </MobileBottomSheet>
          <MobileBottomSheet
            open={mobileSheet === "member"}
            title="Member path"
            testId="showcase-panel-right-mobile"
            onClose={() => setMobileSheet(null)}
          >
            <MemberDetailPanel
              selectedId={selectedMemberId}
              onGoToTab={(tab) => {
                handleGoToTab(tab);
                setMobileSheet("explore");
              }}
              viewerMemberId={loggedInMemberId}
            />
          </MobileBottomSheet>
        </>
      ) : null}

      {isMobile && mapRevealHint && mobileSheet === null ? (
        <MapRevealHint
          message={mapRevealHint}
          onReopenPanel={() => setMobileSheet("explore")}
        />
      ) : null}

      {isMobile ? (
        <nav className="mobile-nav-bar md:hidden" aria-label="Board room navigation">
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

      {boardRoomUnlocked && showGuidedTour ? (
        <GuidedTourOverlay
          key={tourReplayKey}
          onComplete={completeGuidedTour}
          onSkip={skipGuidedTour}
          embedded
          sheetOpen={mobileSheet !== null}
        />
      ) : null}

      <BerPlusChatbot
        memberId={loggedInMemberId}
        mobileNavOffset={isMobile}
        tourDockOpen={isMobile && showGuidedTour}
      />
    </div>
    </GuidedTourProvider>
  );
}

function CollapsibleMapLegend({
  open,
  onOpenChange,
  showBenchmarkLegend
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showBenchmarkLegend: boolean;
}) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="floating-panel pointer-events-auto flex items-center gap-2 px-3 py-2 text-[11px] text-white/70 touch-manipulation hover:text-white/90"
        data-testid="show-map-legend"
        aria-expanded={false}
      >
        <span className="font-medium text-white/55">Map legend</span>
        <span className="text-white/45">Show</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2" data-testid="map-legend-chrome">
      <div className="floating-panel pointer-events-auto flex items-center gap-2 px-3 py-1.5 text-[11px]">
        <span className="font-medium text-white/55">Map legend</span>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="rounded-lg px-2 py-1 text-white/60 hover:bg-white/10 hover:text-white/90 touch-manipulation"
          aria-expanded
        >
          Hide
        </button>
      </div>
      {showBenchmarkLegend ? (
        <div className="floating-panel pointer-events-auto flex max-w-md flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-[11px] text-white/80">
          {(Object.keys(BENCHMARK_CATEGORIES) as BenchmarkCategory[]).map((cat) => (
            <LegendDot
              key={cat}
              color={BENCHMARK_CATEGORY_COLORS[cat]}
              label={BENCHMARK_CATEGORIES[cat].split(" ")[0]}
            />
          ))}
          <span className="text-white/20">|</span>
          <LegendDot color="#f472b6" label="Stakeholders" />
        </div>
      ) : null}
      <div className="floating-panel pointer-events-auto flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-[11px] text-white/80">
        <LegendDot color="#38bdf8" label="BER+ Corridor" glow />
        <span className="text-white/20">|</span>
        <LegendDot color="#0ea5e9" label="BER" glow />
        <span className="text-white/20">|</span>
        <LegendDot color="#10b981" label="Pilot-1" />
        <span className="text-white/20">|</span>
        <LegendDot color={CATEGORY_COLORS.developer} label="Mitglieder" />
        <span className="text-white/20">|</span>
        <LegendDot color="#34d399" label="Land" />
        <LegendDot color="#f59e0b" label="Industry" />
        <LegendDot color="#a3e635" label="Transport" />
        <span className="text-white/20">|</span>
        <LegendDot color="#fbbf24" label="Member zones" />
        <LegendDot color="#f59e0b" label="Member OSM" />
      </div>
    </div>
  );
}

function CollapsibleTimelineChrome({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { focusDate } = useProgramme();
  const phase = phaseForDate(focusDate);
  const phaseLabel = PHASES.find((p) => p.id === phase)?.label ?? "Programme";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="floating-panel mx-auto flex w-full items-center justify-between gap-2 px-3 py-2 text-[11px] text-white/70 touch-manipulation hover:text-white/90"
        data-testid="show-programme-timeline"
        aria-expanded={false}
      >
        <span className="font-medium text-white/55">Programme timeline</span>
        <span className="truncate text-cyan-200/80">{phaseLabel}</span>
        <span className="shrink-0 text-white/45">Show</span>
      </button>
    );
  }

  return (
    <div className="floating-panel px-3 py-2.5" data-testid="programme-timeline-chrome">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-white/55">Programme timeline</span>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="min-h-[36px] rounded-lg px-3 text-xs text-white/60 hover:bg-white/10 hover:text-white/90 touch-manipulation"
          aria-expanded
        >
          Hide
        </button>
      </div>
      <TimelineControl compact />
    </div>
  );
}

function SplitPaneLabel({ side, label }: { side: "left" | "right"; label: string }) {
  return (
    <div
      className={`pointer-events-none absolute top-14 z-[5] max-w-[min(100%,220px)] truncate rounded-md border border-white/15 bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/75 backdrop-blur-sm ${
        side === "left" ? "left-2" : "right-2"
      }`}
      data-testid={side === "left" ? "split-pane-label-left" : "split-pane-label-right"}
    >
      {label}
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
