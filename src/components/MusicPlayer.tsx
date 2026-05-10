"use client";

// Accepts full YouTube URLs or raw IDs:
//   https://www.youtube.com/watch?v=nj-MuUsulMU  → video
//   https://www.youtube.com/playlist?list=PL...   → playlist
//   https://youtu.be/nj-MuUsulMU                  → video
//   nj-MuUsulMU                                   → video ID directly
//   PL7KLwyJCC7QwT8BNvKF7mokkODa6aNfAH           → playlist ID directly

import { useRef, useState, useEffect } from "react";

const RAW = process.env.NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID ?? "";

function extractId(input: string): string {
  if (!input) return "";
  try {
    const url = new URL(input);
    if (url.searchParams.get("v"))    return url.searchParams.get("v")!;
    if (url.searchParams.get("list")) return url.searchParams.get("list")!;
    if (url.hostname === "youtu.be")  return url.pathname.slice(1).split("?")[0];
  } catch {
    // Not a URL — treat as a raw ID
  }
  return input.trim();
}

function buildEmbedUrl(rawInput: string): string {
  const id       = extractId(rawInput);
  const base     = "https://www.youtube-nocookie.com/embed";
  const common   = "autoplay=1&loop=1&controls=0&rel=0&modestbranding=1";
  const isPlaylist = id.length > 11 || /^(PL|FL|RD|UU|LL|WL)/i.test(id);

  return isPlaylist
    ? `${base}/videoseries?list=${id}&${common}`
    : `${base}/${id}?${common}&playlist=${id}`;
}

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Nothing configured — hide the button entirely
  if (!RAW) return null;

  function mount() {
    if (iframeRef.current) return;
    const iframe = document.createElement("iframe");
    iframe.src   = buildEmbedUrl(RAW);
    iframe.allow = "autoplay";
    iframe.setAttribute("allowfullscreen", "false");
    iframe.style.cssText =
      "position:fixed;width:1px;height:1px;border:0;opacity:0.01;pointer-events:none;top:-9999px";
    document.body.appendChild(iframe);
    iframeRef.current = iframe;
  }

  function unmount() {
    iframeRef.current?.remove();
    iframeRef.current = null;
  }

  useEffect(() => () => unmount(), []);

  function toggle() {
    if (playing) {
      unmount();
      setPlaying(false);
    } else {
      mount();
      setPlaying(true);
    }
  }

  return (
    <div className="fixed bottom-16 right-4 z-50 flex flex-col items-end gap-1.5">
      {playing && (
        <span className="text-[10px] font-bold tracking-widest text-gold/70 bg-pitch-dark/90 px-2 py-0.5 rounded-full border border-gold/20 select-none animate-pulse">
          MUSIK ON
        </span>
      )}
      <button
        onClick={toggle}
        title={playing ? "Stäng av musik" : "Starta VM-musik 🎵"}
        aria-label={playing ? "Stäng av musik" : "Starta musik"}
        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-lg border text-xl transition-all duration-200 ${
          playing
            ? "bg-gold/20 border-gold/60 text-gold scale-110"
            : "bg-pitch-dark/90 border-pitch-light/30 text-green-600 hover:border-gold/40 hover:text-gold"
        }`}
      >
        {playing ? "🔊" : "🎵"}
      </button>
    </div>
  );
}
