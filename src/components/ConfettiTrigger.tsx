"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

type Preset = "win" | "badge" | "leaderboard";

interface Props {
  trigger: boolean;
  preset?: Preset;
}

const PRESETS: Record<Preset, () => void> = {
  win: () => {
    // Swedish football gold + green burst
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FFD700", "#0a5c2e", "#ffffff", "#FFD700", "#f0fdf4"],
    });
  },
  badge: () => {
    // Two-sided smaller burst
    confetti({ particleCount: 60, angle: 60,  spread: 55, origin: { x: 0 }, colors: ["#FFD700", "#fbbf24"] });
    confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#FFD700", "#fbbf24"] });
  },
  leaderboard: () => {
    // Cascade from top
    const end = Date.now() + 1500;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60,  spread: 55, origin: { x: 0 }, colors: ["#FFD700", "#0a5c2e"] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#FFD700", "#0a5c2e"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  },
};

export default function ConfettiTrigger({ trigger, preset = "win" }: Props) {
  useEffect(() => {
    if (trigger) PRESETS[preset]();
  }, [trigger, preset]);

  return null;
}
