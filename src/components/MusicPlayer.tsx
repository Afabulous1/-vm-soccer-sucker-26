"use client";

// Stadium crowd atmosphere via Web Audio API — no external files or copyright issues.
// White noise → bandpass filter → slow LFO swell = authentic crowd roar.

import { useRef, useState, useCallback } from "react";

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false);
  const ctxRef  = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const init = useCallback(() => {
    if (ctxRef.current) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // 4-second looping white noise buffer
    const bufSize = 4 * ctx.sampleRate;
    const buffer  = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data    = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop   = true;

    // Bandpass centred on crowd frequency range (~350 Hz)
    const bp  = ctx.createBiquadFilter();
    bp.type   = "bandpass";
    bp.frequency.value = 350;
    bp.Q.value         = 0.55;

    // Second bandpass for warmth (~1200 Hz overtones)
    const bp2 = ctx.createBiquadFilter();
    bp2.type  = "bandpass";
    bp2.frequency.value = 1200;
    bp2.Q.value         = 1.2;

    // Crowd swell LFO (0.06 Hz ≈ one swell every 17 seconds)
    const lfo     = ctx.createOscillator();
    lfo.type      = "sine";
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.018;

    // Master gain (starts at 0)
    const master = ctx.createGain();
    master.gain.value = 0;
    gainRef.current   = master;

    // Routing
    src.connect(bp);
    bp.connect(bp2);
    bp2.connect(master);
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    master.connect(ctx.destination);

    src.start();
    lfo.start();
  }, []);

  function toggle() {
    init();
    const gain = gainRef.current;
    const ctx  = ctxRef.current;
    if (!gain || !ctx) return;

    if (playing) {
      gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
      setTimeout(() => setPlaying(false), 500);
    } else {
      gain.gain.setTargetAtTime(0.065, ctx.currentTime, 0.8);
      setPlaying(true);
    }
  }

  return (
    <button
      onClick={toggle}
      className={`fixed bottom-20 right-4 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg border transition-all duration-200 ${
        playing
          ? "bg-gold/20 border-gold/60 text-gold"
          : "bg-pitch-dark/90 border-pitch-light/30 text-green-600 hover:border-gold/40 hover:text-gold"
      }`}
      title={playing ? "Stäng av stadionatmosfär" : "Sätt på stadionatmosfär 🏟️"}
      aria-label={playing ? "Mute" : "Play stadium atmosphere"}
    >
      {playing ? "🔊" : "🎵"}
    </button>
  );
}
