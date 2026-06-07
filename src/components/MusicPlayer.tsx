"use client";

// iOS Safari requires the iframe to already be in the DOM and have its src
// set synchronously inside a user-gesture handler. Creating it via
// document.createElement (old approach) breaks autoplay on mobile because
// Safari doesn't associate the dynamic element with the tap event.

import { useRef, useState, useEffect } from "react";

const RAW = process.env.NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID ?? "";

function extractId(input: string): string {
  if (!input) return "";
  try {
    const url = new URL(input);
    if (url.searchParams.get("list")) return url.searchParams.get("list")!;
    if (url.searchParams.get("v"))    return url.searchParams.get("v")!;
    if (url.hostname === "youtu.be")  return url.pathname.slice(1).split("?")[0];
  } catch {
    // Not a URL — treat as raw ID
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
  const [prompted, setPrompted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!RAW) return;
    const t = setTimeout(() => setPrompted(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!RAW) return null;

  function toggle() {
    setPrompted(false);
    const iframe = iframeRef.current;
    if (!iframe) return;

    if (playing) {
      iframe.src = "";
      setPlaying(false);
    } else {
      // Synchronous src assignment inside tap handler — iOS Safari allows autoplay
      iframe.src = buildEmbedUrl(RAW);
      setPlaying(true);
    }
  }

  return (
    <>
      {/*
        Always in the DOM, bottom-left corner, 1×1 px, near-zero opacity.
        Must NOT be display:none or visibility:hidden — iOS blocks autoplay on
        hidden iframes. opacity:0.01 is invisible to users but "visible" to Safari.
      */}
      <iframe
        ref={iframeRef}
        src=""
        allow="autoplay; encrypted-media"
        title="background music"
        style={{
          position:      "fixed",
          bottom:        0,
          left:          0,
          width:         1,
          height:        1,
          opacity:       0.01,
          border:        "none",
          pointerEvents: "none",
          zIndex:        -1,
        }}
      />

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
    </>
  );
}
