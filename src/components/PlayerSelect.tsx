"use client";

import { useState, useRef, useEffect } from "react";
import { FAMOUS_PLAYERS } from "@/lib/teams";

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  accentClass?: string; // tailwind border/ring color, e.g. "focus:ring-gold/30 focus:border-gold/40"
  includeNoGoal?: boolean; // prepends "Ingen målskytt" option
}

const NO_GOAL = "Ingen målskytt";

export default function PlayerSelect({
  value,
  onChange,
  disabled,
  accentClass = "focus:ring-gold/30 focus:border-gold/40",
  includeNoGoal,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const baseList = includeNoGoal ? [NO_GOAL, ...FAMOUS_PLAYERS] : FAMOUS_PLAYERS;
  const filtered = baseList
    .filter((p) => p.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 12);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleSelect(player: string) {
    onChange(player);
    setOpen(false);
    setSearch("");
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setOpen(false);
    setSearch("");
  }

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={`w-full bg-pitch-dark border rounded-lg px-3 py-2.5 text-sm cursor-pointer flex justify-between items-center gap-2 ${
          disabled
            ? "opacity-50 cursor-not-allowed border-pitch-light/30"
            : `border-pitch-light/50 hover:border-gold/40 ${open ? accentClass : ""}`
        }`}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className={value ? "text-white truncate" : "text-green-700"}>
          {value || "Välj spelare..."}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-green-600 hover:text-white text-xs leading-none px-1"
              title="Rensa val"
            >
              ✕
            </button>
          )}
          <span className="text-green-600 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-pitch-dark border border-pitch-light/50 rounded-lg shadow-xl overflow-hidden">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök spelare..."
            className="w-full bg-pitch-dark px-3 py-2 text-sm text-white placeholder-green-700 border-b border-pitch-light/30 outline-none"
          />
          <div className="max-h-48 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-white hover:bg-pitch-light/30 transition-colors"
                  onClick={() => handleSelect(p)}
                >
                  {p}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-green-700">Ingen spelare hittad</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
