"use client";

import { useState } from "react";
import type { LeftTab } from "@/components/BerPlusValuePanel";
import { GUEST_PERSONAS, type GuestPersona } from "@/lib/guest-personas";

const ALL_TABS: LeftTab[] = ["value", "members", "junqingchu", "programme", "briefing"];

const TAB_LABELS: Record<LeftTab, string> = {
  value: "Overview",
  foryou: "For you",
  members: "Mitglieder",
  junqingchu: "Assets",
  inventory: "Asset mgmt",
  programme: "Programme",
  briefing: "Briefing"
};

type Props = {
  leftTab: LeftTab;
  onSelect: (tab: LeftTab) => void;
  guestPersona?: GuestPersona | null;
  showForYou?: boolean;
};

export function PersonaTabBar({ leftTab, onSelect, guestPersona, showForYou }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const personaConfig = guestPersona ? GUEST_PERSONAS[guestPersona] : null;
  const primary = personaConfig?.highlightTabs ?? ALL_TABS;
  const secondary = ALL_TABS.filter((t) => !primary.includes(t));
  const moreActive = secondary.includes(leftTab);

  return (
    <div className="mb-3 space-y-1.5" data-testid="persona-tab-bar">
      <div className="mobile-scroll-x -mx-1 flex gap-1 rounded-lg bg-white/5 p-1">
        {showForYou ? (
          <TabBtn
            testId="map-tab-foryou"
            active={leftTab === "foryou"}
            highlighted
            onClick={() => onSelect("foryou")}
          >
            For you
          </TabBtn>
        ) : null}
        {primary.map((tab) => (
          <TabBtn
            key={tab}
            testId={`map-tab-${tab === "value" ? "value" : tab === "junqingchu" ? "junqingchu" : tab === "inventory" ? "inventory" : tab}`}
            active={leftTab === tab}
            highlighted={!!personaConfig}
            onClick={() => onSelect(tab)}
          >
            {TAB_LABELS[tab]}
          </TabBtn>
        ))}
        {secondary.length > 0 ? (
          <div className="relative">
            <TabBtn
              testId="map-tab-more"
              active={moreOpen || moreActive}
              onClick={() => setMoreOpen((o) => !o)}
            >
              More {moreActive ? `· ${TAB_LABELS[leftTab]}` : ""}
            </TabBtn>
            {moreOpen ? (
              <div className="absolute left-0 top-full z-30 mt-1 min-w-[9rem] rounded-lg border border-white/15 bg-ink-900/98 p-1 shadow-xl">
                {secondary.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    data-testid={`map-tab-more-${tab}`}
                    onClick={() => {
                      onSelect(tab);
                      setMoreOpen(false);
                    }}
                    className={`block w-full rounded-md px-3 py-2 text-left text-xs font-medium ${
                      leftTab === tab ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/8"
                    }`}
                  >
                    {TAB_LABELS[tab]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      {personaConfig ? (
        <p className="px-0.5 text-[10px] text-white/40">
          Tabs tuned for <span className="text-white/60">{personaConfig.shortLabel}</span> — use More for
          other views
        </p>
      ) : null}
    </div>
  );
}

function TabBtn({
  active,
  highlighted,
  onClick,
  children,
  testId
}: {
  active: boolean;
  highlighted?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`relative min-h-[44px] shrink-0 rounded-md px-3 py-2 text-xs font-medium transition touch-manipulation ${
        active
          ? highlighted
            ? "bg-sky-500/22 text-white ring-1 ring-sky-400/45"
            : "bg-white/12 text-white"
          : highlighted
            ? "text-sky-200/85 hover:bg-sky-500/10"
            : "text-white/60 hover:text-white/80"
      }`}
    >
      {children}
    </button>
  );
}

export { TAB_LABELS };
