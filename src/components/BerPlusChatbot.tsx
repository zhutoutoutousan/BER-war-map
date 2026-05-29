"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMitgliedById } from "@/data/mitglieder";
import { buildLiveMatches, formatMatchesForAi } from "@/lib/local-member-matching";
import { useOsmIntel } from "@/context/OsmIntelContext";

type Message = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "What land anchors are linked to me?",
  "Who are my peer matches on the corridor?",
  "Summarize my top OSM assets",
  "What should I do first in Phase I?"
];

export function BerPlusChatbot({ memberId }: { memberId: string | null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data } = useOsmIntel();

  const member = memberId ? getMitgliedById(memberId) : null;
  const liveMatches = memberId ? buildLiveMatches(memberId, data?.geojson ?? null) : [];

  useEffect(() => {
    fetch("/api/ai/chat")
      .then((r) => r.json())
      .then((j) => setOllamaOk(Boolean(j.available)))
      .catch(() => setOllamaOk(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: Message = { role: "user", content: text.trim() };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setLoading(true);

      const memberContext = member
        ? `${member.name} (${member.shortName})\nCategory: ${member.category}\nRole: ${member.corridorRole}\n${member.intro}`
        : undefined;
      const matchContext = memberId ? formatMatchesForAi(memberId, liveMatches) : undefined;

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMsg],
            memberContext,
            matchContext
          })
        });
        const json = (await res.json()) as { reply?: string; error?: string };
        const reply =
          json.reply ??
          json.error ??
          "No reply — check Ollama is running (`ollama serve`).";
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
      } catch {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              "Could not reach the AI service. Local matching in **For you** still works without Ollama."
          }
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, member, memberId, liveMatches, messages]
  );

  if (!memberId) return null;

  return (
    <div className="pointer-events-none fixed bottom-20 right-3 z-[60] sm:bottom-24 sm:right-4">
      {open ? (
        <div
          className="pointer-events-auto mb-2 flex w-[min(100vw-1.5rem,380px)] flex-col overflow-hidden rounded-xl border border-violet-500/30 bg-ink-900/95 shadow-2xl backdrop-blur-md"
          data-testid="ber-chatbot-panel"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <div>
              <div className="text-xs font-semibold text-violet-200">BER+ Assistant</div>
              <div className="text-[10px] text-white/45">
                {ollamaOk ? "Ollama · local" : ollamaOk === false ? "Offline · rule-based fallback" : "…"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded px-2 py-0.5 text-xs text-white/60 hover:bg-white/10"
            >
              Close
            </button>
          </div>

          <div ref={scrollRef} className="war-room-scroll max-h-64 space-y-2 overflow-y-auto px-3 py-2">
            {messages.length === 0 ? (
              <div className="space-y-2 text-[11px] text-white/55">
                <p>
                  Hi {member?.shortName} — ask about your corridor matches, land anchors, or peers.
                  I use local OSM matching + Ollama when available.
                </p>
                <div className="flex flex-wrap gap-1">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-violet-500/25 bg-violet-950/30 px-2 py-0.5 text-[10px] text-violet-100 hover:bg-violet-900/40"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed ${
                  m.role === "user"
                    ? "ml-6 bg-sky-950/40 text-sky-100"
                    : "mr-4 bg-white/5 text-white/80"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading ? (
              <div className="text-[11px] text-white/40">Thinking…</div>
            ) : null}
          </div>

          <form
            className="flex gap-1 border-t border-white/10 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your matches…"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white placeholder:text-white/35"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="shrink-0 rounded-lg bg-violet-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-violet-500/40 bg-violet-950/90 px-4 py-2.5 text-sm font-medium text-violet-100 shadow-lg hover:bg-violet-900/90"
        data-testid="ber-chatbot-toggle"
      >
        <span className="text-base">✦</span>
        AI Assistant
      </button>
    </div>
  );
}
