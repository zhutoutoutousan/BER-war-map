"use client";

import { useState } from "react";
import { ContractsPanel } from "@/components/ContractsPanel";
import { TimelineControl } from "@/components/TimelineControl";
import { useProgramme } from "@/context/ProgrammeContext";

type SubTab = "timeline" | "contracts";

export function ProgrammePanel() {
  const [subTab, setSubTab] = useState<SubTab>("timeline");
  const { resetProgramme } = useProgramme();

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="panel-programme">
      <div className="mb-3 flex gap-1 rounded-lg bg-white/5 p-1">
        <SubTabButton active={subTab === "timeline"} onClick={() => setSubTab("timeline")}>
          Timeline
        </SubTabButton>
        <SubTabButton active={subTab === "contracts"} onClick={() => setSubTab("contracts")}>
          Contracts
        </SubTabButton>
      </div>
      {subTab === "timeline" ? <TimelineControl /> : <ContractsPanel />}
      <button
        type="button"
        onClick={resetProgramme}
        className="mt-3 shrink-0 rounded border border-white/10 px-2 py-1 text-[10px] text-white/45 hover:bg-white/5 hover:text-white/70"
      >
        Reset programme data
      </button>
    </div>
  );
}

function SubTabButton({
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
      className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium ${
        active ? "bg-white/12 text-white" : "text-white/60 hover:text-white/80"
      }`}
    >
      {children}
    </button>
  );
}
