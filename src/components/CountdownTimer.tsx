"use client";

import { useEffect, useMemo, useState } from "react";

interface Props {
  locksAt: Date | string;
  onLocked?: () => void;
}

function getTimeLeft(target: Date): {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const total = Math.max(0, target.getTime() - Date.now());
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { total, days, hours, minutes, seconds };
}

export default function CountdownTimer({ locksAt, onLocked }: Props) {
  const target = useMemo(
    () => (locksAt instanceof Date ? locksAt : new Date(locksAt)),
    [locksAt]
  );
  const [time, setTime] = useState(() => getTimeLeft(target));

  useEffect(() => {
    if (time.total <= 0) return;
    const id = setInterval(() => {
      const next = getTimeLeft(target);
      setTime(next);
      if (next.total <= 0) {
        clearInterval(id);
        onLocked?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target, onLocked, time.total]);

  if (time.total <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
        🔒 Låst
      </span>
    );
  }

  const isCritical = time.total < 5 * 60 * 1000;   // < 5 min
  const isUrgent   = time.total < 60 * 60 * 1000;  // < 1 hr

  const label = () => {
    if (isCritical)
      return `${String(time.minutes).padStart(2, "0")}:${String(time.seconds).padStart(2, "0")}`;
    if (isUrgent)
      return `${time.hours}t ${String(time.minutes).padStart(2, "0")}m`;
    if (time.days > 0)
      return `${time.days}d ${time.hours}t`;
    return `${time.hours}t ${time.minutes}m`;
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${
        isCritical
          ? "text-red-400 animate-pulse"
          : isUrgent
          ? "text-amber-400"
          : "text-green-400"
      }`}
    >
      {isCritical ? "⏰" : "🕐"} {isCritical ? "LÅSER SNART! " : ""}{label()}
    </span>
  );
}
