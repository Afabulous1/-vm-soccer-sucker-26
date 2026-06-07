"use client";

// Accepts full YouTube URLs or raw IDs.
// When a URL has both ?v= and &list=, list takes priority (radio/mix support).

import { useRef, useState, useEffect } from "react";

const RAW = process.env.NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID ?? "";

function extractId(input: string): string {
  if (!input) return "";
  try {
    const url = new URL(input);
    // Prefer list= over v= so radio mixes (RD*) work correctly
    if (url.searchParams.get("list")) return url.searchParams.get("list")!;
    if (url.searchParams.get("v"))    return url.searchParams.get("v")!;
    if (url.hostname === "youtu.be")  return url.pathname.slice(1).split("?")[0];
  } catch {
    // Not a URL — raw ID
  }
  return input.trim();
}

function buildEmbedUrl(rawInput: string): string {
  const id         = extractId(rawInput);
  const base       = "https://www.youtube-nocookie.com/embed";
  const common     = "autoplay=1&loop=1&controls=0&rel=0&modestbranding=1&enablejsapi=0";
  const isPlaylist = id.length > 11 || /^(PL|FL|RD|UU|LL|WL)/i.test(id);

  return isPlaylist
    ? `${base}/videoseries?list=${id}&${common}`
    : `${base}/${id}?${common}&playlist=${id}`;
}

export default function MusicPlayer() {
  const [playing,  setPlaying]  = useState(false);
  const [prompted, setPrompted] = useState(false); // show the CTA banner
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  function mount() {
    if (iframeRef.current || !RAW) return;
    const iframe = document.createElement("iframe");
    iframe.src   = buildEmbedUrl(RAW);
    iframe.allow = "autoplay; encrypted-media";
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

  // Show the music CTA banner 2 s after mount so users notice it
  useEffect(() => {
    if (!RAW) return;
    const t = setTimeout(() => setPrompted(true), 2000);
    return () => { clearTimeout(t); unmount(); };
  }, []);

  if (!RAW) return null;

  function toggle() {
    setPrompted(false);
    if (playing) {
      unmount();
      setPlaying(false);
    } else {
      mount();
      setPlaying(true);
    }
  }

  return (
    <div className="fixed bottom-20 right-3 z-50 flex flex-col items-end gap-2">

      {/* CTA banner — shown before first interaction */}
      {prompted && !playing && (
        <div className="flex items-center gap-2 bg-pitch-dark/95 border border-gold/30 rounded-2xl px-3 py-2 shadow-xl shadow-black/40 animate-bounce">
          <span className="text-lg">🎵</span>
          <span className="text-gold text-xs font-bold whitespace-nowrap">Starta VM-musik!</span>
          <button
            onClick={() => setPrompted(false)}
            className="text-green-700 hover:text-green-400 text-xs ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main button */}
      <button
        onClick={toggle}
        title={playing ? "Stäng av musik" : "Starta VM-musik"}
        aria-label={playing ? "Stäng av musik" : "Starta VM-musik"}
        className={`w-13 h-13 rounded-full flex items-center justify-center shadow-xl border-2 text-2xl transition-all duration-200 active:scale-95 touch-manipulation ${
          playing
            ? "bg-gold/20 border-gold text-gold scale-110 shadow-gold/30"
            : "bg-pitch-dark border-gold/40 text-gold hover:bg-gold/10 hover:border-gold"
        }`}
        style={{ width: 52, height: 52 }}
      >
        {playing ? "🔊" : "🎵"}
      </button>

      {playing && (
        <span className="text-[10px] font-bold tracking-widest text-gold/60 select-none text-center w-full">
          ♪ live
        </span>
      )}
    </div>
  );
}
