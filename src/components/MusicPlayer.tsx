"use client";

// Two music modes:
// 1. CROWD  — Web Audio API crowd atmosphere (white noise → bandpass → LFO swell). Always available.
// 2. MUSIC  — YouTube playlist iframe (set NEXT_PUBLIC_YOUTUBE_YT_ID in .env.local).
//
// Click cycles: OFF → CROWD → MUSIC (if playlist set) → OFF

import { useRef, useState, useCallback, useEffect } from "react";

// Accepts either a single video ID (e.g. dQw4w9WgXcQ — 11 chars)
// or a playlist ID (e.g. PL7KLwyJCC7QwT8BNvKF7mokkODa6aNfAH — starts with PL)
const YT_ID = process.env.NEXT_PUBLIC_YOUTUBE_YT_ID ?? "";

type Mode = "off" | "crowd" | "music";

function buildYouTubeUrl(id: string) {
  const base   = "https://www.youtube-nocookie.com/embed";
  const common = "autoplay=1&loop=1&controls=0&rel=0&modestbranding=1";

  // Playlist IDs start with PL (or FL/RD/UU) and are >11 chars
  const isPlaylist = id.length > 11 || /^(PL|FL|RD|UU|LL|WL)/i.test(id);

  if (isPlaylist) {
    return `${base}/videoseries?list=${id}&${common}`;
  } else {
    // Single video — playlist param is required for loop=1 to work
    return `${base}/${id}?${common}&playlist=${id}`;
  }
}

export default function MusicPlayer() {
  const [mode, setMode]     = useState<Mode>("off");
  const gainRef             = useRef<GainNode | null>(null);
  const ctxRef              = useRef<AudioContext | null>(null);
  const iframeRef           = useRef<HTMLIFrameElement | null>(null);

  // ── Web Audio crowd atmosphere ──────────────────────────────────────────
  const initCrowd = useCallback(() => {
    if (ctxRef.current) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const bufSize = 4 * ctx.sampleRate;
    const buffer  = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data    = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop   = true;

    const bp1 = ctx.createBiquadFilter();
    bp1.type = "bandpass"; bp1.frequency.value = 350; bp1.Q.value = 0.55;

    const bp2 = ctx.createBiquadFilter();
    bp2.type = "bandpass"; bp2.frequency.value = 1200; bp2.Q.value = 1.2;

    const master = ctx.createGain();
    master.gain.value = 0;
    gainRef.current   = master;

    const lfo  = ctx.createOscillator();
    lfo.type   = "sine";
    lfo.frequency.value = 0.06;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.018;
    lfo.connect(lfoG);
    lfoG.connect(master.gain);

    src.connect(bp1); bp1.connect(bp2); bp2.connect(master);
    master.connect(ctx.destination);
    src.start(); lfo.start();
  }, []);

  // ── YouTube iframe ──────────────────────────────────────────────────────
  function mountYouTube() {
    if (!YT_ID || iframeRef.current) return;
    const iframe    = document.createElement("iframe");
    iframe.src      = buildYouTubeUrl(YT_ID);
    iframe.allow    = "autoplay";
    iframe.style.cssText = "position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none";
    document.body.appendChild(iframe);
    iframeRef.current = iframe;
  }

  function unmountYouTube() {
    iframeRef.current?.remove();
    iframeRef.current = null;
  }

  useEffect(() => () => unmountYouTube(), []);

  // ── Toggle logic ────────────────────────────────────────────────────────
  function toggle() {
    const ctx  = ctxRef.current;
    const gain = gainRef.current;

    if (mode === "off") {
      initCrowd();
      // Need slight delay for AudioContext to be ready
      setTimeout(() => {
        gainRef.current?.gain.setTargetAtTime(0.065, ctxRef.current!.currentTime, 0.8);
      }, 50);
      setMode("crowd");
      return;
    }

    if (mode === "crowd") {
      if (YT_ID) {
        // Switch to YouTube music, mute crowd
        gain?.gain.setTargetAtTime(0.0001, ctx!.currentTime, 0.4);
        mountYouTube();
        setMode("music");
      } else {
        // No playlist — turn off
        gain?.gain.setTargetAtTime(0.0001, ctx!.currentTime, 0.4);
        setMode("off");
      }
      return;
    }

    if (mode === "music") {
      unmountYouTube();
      setMode("off");
    }
  }

  // ── UI ──────────────────────────────────────────────────────────────────
  const label =
    mode === "crowd" ? "🏟️" :
    mode === "music" ? "🎵" :
    "🎵";

  const title =
    mode === "crowd" ? "Stadionatmosfär på · klicka för YouTube-musik" :
    mode === "music" ? "YouTube-musik på · klicka för att stänga av" :
    YT_ID
      ? "Klicka för stadionatmosfär (sedan YouTube-musik)"
      : "Klicka för stadionatmosfär";

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-1.5">
      {/* Mode label */}
      {mode !== "off" && (
        <span className="text-[10px] font-bold tracking-widest text-gold/70 bg-pitch-dark/90 px-2 py-0.5 rounded-full border border-gold/20 select-none">
          {mode === "crowd" ? "STADION" : "MUSIK"}
        </span>
      )}

      <button
        onClick={toggle}
        title={title}
        aria-label={title}
        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border text-xl transition-all duration-200 ${
          mode !== "off"
            ? "bg-gold/20 border-gold/60 text-gold scale-105"
            : "bg-pitch-dark/90 border-pitch-light/30 text-green-600 hover:border-gold/40 hover:text-gold"
        }`}
      >
        {label}
      </button>
    </div>
  );
}
