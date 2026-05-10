"use client";

import { useState, useEffect } from "react";
import { TOURNAMENT_LOCK } from "@/lib/bets";
import { getSimOffsetMs } from "@/lib/now";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function LockBanner() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const offset = getSimOffsetMs();
    function tick() {
      const ms = TOURNAMENT_LOCK.getTime() - (Date.now() + offset);
      setRemaining(ms);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Don't render until we have a value (avoids hydration mismatch)
  if (remaining === null) return null;

  // Already locked or > 48h away — show nothing
  if (remaining <= 0 || remaining > FORTY_EIGHT_HOURS_MS) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isUrgent = remaining < ONE_HOUR_MS;

  if (isUrgent) {
    const mm = pad(minutes);
    const ss = pad(seconds);
    return (
      <div className="bg-red-600 animate-pulse text-white text-center text-sm font-semibold py-2 px-4">
        🔥 LÅSER SNART! {mm}:{ss} kvar — lägg dina gissningar NU!
      </div>
    );
  }

  return (
    <div className="bg-amber-500 text-amber-950 text-center text-sm font-semibold py-2 px-4">
      ⏰ Turneringsgissningar låser om {hours}h {minutes}m {seconds}s — lägg dina gissningar nu!
    </div>
  );
}
