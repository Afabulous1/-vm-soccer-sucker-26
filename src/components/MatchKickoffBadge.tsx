"use client";

import { useState, useEffect, useMemo } from "react";
import { getSimOffsetMs } from "@/lib/now";

function getLeft(target: Date, offset: number) {
  const total = Math.max(0, target.getTime() - (Date.now() + offset));
  const days    = Math.floor(total / 86_400_000);
  const hours   = Math.floor((total / 3_600_000) % 24);
  const minutes = Math.floor((total / 60_000) % 60);
  const seconds = Math.floor((total / 1_000) % 60);
  return { total, days, hours, minutes, seconds };
}

export default function MatchKickoffBadge({ kickoffAt }: { kickoffAt: string }) {
  // Betting closes 15 min before kickoff — count down to that, not to kickoff itself
  const lockTarget = useMemo(() => {
    const t = new Date(kickoffAt);
    t.setMinutes(t.getMinutes() - 15);
    return t;
  }, [kickoffAt]);

  const offset = useMemo(() => getSimOffsetMs(), []);
  const [left, setLeft] = useState(() => getLeft(lockTarget, offset));

  useEffect(() => {
    const id = setInterval(() => setLeft(getLeft(lockTarget, offset)), 1_000);
    return () => clearInterval(id);
  }, [lockTarget, offset]);

  if (left.total <= 0) {
    return <span className="text-amber-400 text-xs font-semibold">🔒 Låst</span>;
  }

  const { total, days, hours, minutes, seconds } = left;
  const isCritical = total < 5 * 60_000;
  const isUrgent   = total < 3_600_000;

  const label = isCritical
    ? `⏰ ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : isUrgent
    ? `⚡ Låser ${hours}t ${String(minutes).padStart(2, "0")}m`
    : days > 0
    ? `🟢 ${days}d ${hours}t`
    : `🟢 ${hours}t ${String(minutes).padStart(2, "0")}m`;

  return (
    <span
      className={`text-xs font-semibold tabular-nums ${
        isCritical
          ? "text-red-400 animate-pulse"
          : isUrgent
          ? "text-amber-400"
          : "text-green-500"
      }`}
    >
      {label}
    </span>
  );
}
