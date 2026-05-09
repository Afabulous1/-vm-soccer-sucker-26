"use client";

import { useState, useEffect } from "react";

function getLeft(target: Date) {
  const total = Math.max(0, target.getTime() - Date.now());
  const days    = Math.floor(total / 86_400_000);
  const hours   = Math.floor((total / 3_600_000) % 24);
  const minutes = Math.floor((total / 60_000) % 60);
  const seconds = Math.floor((total / 1_000) % 60);
  return { total, days, hours, minutes, seconds };
}

export default function MatchKickoffBadge({ kickoffAt }: { kickoffAt: string }) {
  const target  = new Date(kickoffAt);
  const [left, setLeft] = useState(() => getLeft(target));

  useEffect(() => {
    const id = setInterval(() => setLeft(getLeft(target)), 1_000);
    return () => clearInterval(id);
  });

  if (left.total <= 0) {
    return <span className="text-amber-400 text-xs font-semibold">🔒 Låst</span>;
  }

  const { total, days, hours, minutes, seconds } = left;
  const isCritical = total < 5 * 60_000;
  const isUrgent   = total < 3_600_000;

  const label = isCritical
    ? `⏰ ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : isUrgent
    ? `⚡ ${hours}t ${String(minutes).padStart(2, "0")}m`
    : days > 0
    ? `🕐 ${days}d ${hours}t`
    : `🕐 ${hours}t ${String(minutes).padStart(2, "0")}m`;

  return (
    <span
      className={`text-xs font-semibold tabular-nums ${
        isCritical
          ? "text-red-400 animate-pulse"
          : isUrgent
          ? "text-amber-400"
          : "text-violet-400"
      }`}
    >
      {label}
    </span>
  );
}
