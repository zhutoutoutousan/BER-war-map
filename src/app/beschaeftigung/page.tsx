import { GrafBriefingContent } from "@/components/GrafBriefingContent";

export const metadata = {
  title: "Beschäftigungstiefe · BER+ Board Room",
  description: "Workforce depth briefing — Schönefeld corridor employer map and employment model."
};

export default function BeschaeftigungPage() {
  return (
    <div className="min-h-[100dvh] overflow-y-auto bg-ink-950 text-white">
      <GrafBriefingContent />
    </div>
  );
}
