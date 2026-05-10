// Dev-only time simulation via cookie "vm26_sim" (ISO string).
// Set the cookie from /dev to fast-forward to any tournament date.
// In production this is always a no-op — real time only.

/** Server components: await getNowServer() instead of new Date() */
export async function getNowServer(): Promise<Date> {
  if (process.env.NODE_ENV === "production") return new Date();
  try {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const sim = store.get("vm26_sim")?.value;
    if (sim) return new Date(sim);
  } catch {}
  return new Date();
}

/**
 * Client components: add this offset to Date.now() inside intervals.
 * Keeps countdowns ticking in real time relative to the simulated "now".
 *   const offset = getSimOffsetMs();
 *   const ms = targetDate.getTime() - (Date.now() + offset);
 */
export function getSimOffsetMs(): number {
  if (typeof document === "undefined" || process.env.NODE_ENV === "production") return 0;
  const m = document.cookie.match(/(?:^|; )vm26_sim=([^;]*)/);
  if (!m) return 0;
  const simMs = new Date(decodeURIComponent(m[1])).getTime();
  return isNaN(simMs) ? 0 : simMs - Date.now();
}
