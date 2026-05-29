const PREFIX = "[ber-matching]";
const LS_KEY = "ber-matching-trace";

function tracingEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const forced = window.localStorage.getItem(LS_KEY);
    if (forced === "0") return false;
    if (forced === "1") return true;
  } catch {
    /* ignore */
  }
  return process.env.NODE_ENV === "development";
}

function stamp() {
  return new Date().toISOString().slice(11, 23);
}

export function mgTrace(scope: string, message: string, data?: Record<string, unknown>) {
  if (!tracingEnabled()) return;
  if (data) console.log(`${PREFIX} ${stamp()} [${scope}] ${message}`, data);
  else console.log(`${PREFIX} ${stamp()} [${scope}] ${message}`);
}

export function mgTraceWarn(scope: string, message: string, data?: Record<string, unknown>) {
  if (!tracingEnabled()) return;
  if (data) console.warn(`${PREFIX} ${stamp()} [${scope}] ${message}`, data);
  else console.warn(`${PREFIX} ${stamp()} [${scope}] ${message}`);
}

export function mgTracePerf(scope: string, ms: number, data?: Record<string, unknown>) {
  if (!tracingEnabled()) return;
  const level = ms > 32 ? "warn" : "log";
  const payload = { ms: Math.round(ms * 100) / 100, ...data };
  if (level === "warn") mgTraceWarn(scope, "slow", payload);
  else mgTrace(scope, "perf", payload);
}

export function mgTraceBegin(scope: string, label: string): () => void {
  if (!tracingEnabled()) return () => {};
  const t0 = performance.now();
  mgTrace(scope, `begin ${label}`);
  return () => {
    mgTracePerf(scope, performance.now() - t0, { label });
  };
}

/** Browser console: localStorage.setItem('ber-matching-trace','1') then reload */
export function enableMatchingGraphTrace(on = true) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, on ? "1" : "0");
  mgTrace("config", on ? "trace ON — reload" : "trace OFF — reload");
}

if (typeof window !== "undefined") {
  (window as Window & { enableMatchingGraphTrace?: typeof enableMatchingGraphTrace }).enableMatchingGraphTrace =
    enableMatchingGraphTrace;
}
