"use client";

import { useState, useEffect, useMemo } from "react";
import { getSimOffsetMs } from "@/lib/now";

function getTimeLeft(target: Date, offset: number) {
  const total = Math.max(0, target.getTime() - (Date.now() + offset));
  const days    = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);
  return { total, days, hours, minutes, seconds };
}

function Digit({ value, label }: { value: number; label: string }) {
  const str = String(value).padStart(2, "0");
  return (
    <div className="text-center">
      <div className="rounded-2xl bg-pitch-dark border border-gold/20 shadow-lg shadow-black/40 px-4 py-3 min-w-[72px]">
        <span className="font-bebas text-5xl sm:text-6xl text-gold tabular-nums tracking-widest block leading-none">
          {str}
        </span>
      </div>
      <p className="text-[10px] font-bold tracking-[0.2em] text-green-600 mt-1.5 uppercase">{label}</p>
    </div>
  );
}

export default function BigCountdown({ target, onExpired }: { target: string; onExpired?: () => void }) {
  const date   = useMemo(() => new Date(target), [target]);
  const offset = useMemo(() => getSimOffsetMs(), []);
  const [time, setTime] = useState(() => getTimeLeft(date, offset));

  useEffect(() => {
    if (time.total <= 0) { onExpired?.(); return; }
    const id = setInterval(() => {
      const next = getTimeLeft(date, offset);
      setTime(next);
      if (next.total <= 0) { clearInterval(id); onExpired?.(); }
    }, 1000);
    return () => clearInterval(id);
  }, [date, offset, time.total, onExpired]);

  if (time.total <= 0) return null;

  return (
    <div className="flex items-end justify-center gap-2 sm:gap-3">
      <Digit value={time.days}    label="Dagar" />
      <span className="font-bebas text-4xl text-gold/40 pb-5">:</span>
      <Digit value={time.hours}   label="Timmar" />
      <span className="font-bebas text-4xl text-gold/40 pb-5">:</span>
      <Digit value={time.minutes} label="Minuter" />
      <span className="font-bebas text-4xl text-gold/40 pb-5">:</span>
      <Digit value={time.seconds} label="Sekunder" />
    </div>
  );
}
