import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OLLAMA_URL = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5-coder:7b";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function POST(req: Request) {
  let body: {
    messages?: ChatMessage[];
    memberContext?: string;
    matchContext?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userMessages = body.messages ?? [];
  const systemParts = [
    "You are BER+ Corridor Assistant — a concise demo AI for the Flughafenregion Board Room map.",
    "Help Mitglieder find land anchors, OSM-linked assets, peer matches, and next steps.",
    "Be practical, short (2–4 sentences unless asked for detail). OSM data is indicative only — not cadastral.",
    "If you lack data, say so and suggest opening OSM Intel or Mitglieder tabs."
  ];
  if (body.memberContext) systemParts.push(`\nMember profile:\n${body.memberContext}`);
  if (body.matchContext) systemParts.push(`\nLocal matches (rule-based):\n${body.matchContext}`);

  const messages: ChatMessage[] = [
    { role: "system", content: systemParts.join("\n") },
    ...userMessages.filter((m) => m.role === "user" || m.role === "assistant")
  ];

  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        options: { temperature: 0.4, num_predict: 512 }
      }),
      signal: AbortSignal.timeout(120000)
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Ollama error (${res.status})`, detail: errText.slice(0, 200), fallback: true },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { message?: { content?: string } };
    const reply =
      data.message?.content?.trim() ??
      "I could not generate a reply. Try asking about your land anchors or OSM matches.";

    return NextResponse.json({ reply, model: OLLAMA_MODEL, source: "ollama" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ollama unreachable";
    return NextResponse.json(
      {
        error: msg,
        fallback: true,
        reply:
          "Ollama is not reachable locally. Start it with `ollama serve` and ensure qwen2.5-coder:7b is installed. Meanwhile, use the **Recommended for you** cards — they run local OSM matching without AI."
      },
      { status: 503 }
    );
  }
}

export async function GET() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return NextResponse.json({ available: false });
    const data = (await res.json()) as { models?: { name: string }[] };
    const models = data.models?.map((m) => m.name) ?? [];
    return NextResponse.json({
      available: true,
      models,
      defaultModel: OLLAMA_MODEL,
      url: OLLAMA_URL
    });
  } catch {
    return NextResponse.json({ available: false, defaultModel: OLLAMA_MODEL });
  }
}
