"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AVATARS } from "@/lib/avatars";
import { createProfile } from "./actions";

interface Props {
  username: string;
}

export default function OnboardingForm({ username }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    if (!selectedAvatar) {
      setError("Välj en avatar för att fortsätta!");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createProfile({ avatarKey: selectedAvatar });
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="text-center p-4 rounded-xl bg-pitch-dark/60 border border-pitch-light/30">
        <p className="text-green-400 text-sm">Du spelar som</p>
        <p className="font-bebas text-3xl text-gold tracking-wide mt-1">{username}</p>
      </div>

      {/* Avatar grid */}
      <div>
        <p className="text-green-300 text-xs font-semibold mb-3 uppercase tracking-wider">
          Välj din persona
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {AVATARS.map((avatar) => {
            const isSelected = selectedAvatar === avatar.key;
            return (
              <button
                key={avatar.key}
                type="button"
                onClick={() => { setSelectedAvatar(avatar.key); setError(null); }}
                className={`
                  relative rounded-xl p-4 text-center transition-all duration-200 active:scale-95
                  bg-gradient-to-br ${avatar.gradient}
                  ${
                    isSelected
                      ? `ring-4 ${avatar.ringColor} ring-offset-2 ring-offset-pitch scale-[1.03] shadow-lg`
                      : "ring-2 ring-transparent hover:ring-white/20 hover:scale-[1.02]"
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-white rounded-full w-5 h-5 flex items-center justify-center">
                    <span className="text-pitch-dark text-xs font-bold">✓</span>
                  </div>
                )}
                <div className="text-5xl mb-2 leading-none">{avatar.emoji}</div>
                <div className="text-white font-bold text-xs leading-tight mb-1">
                  {avatar.name}
                </div>
                <div className="text-white/70 text-[10px] leading-tight line-clamp-2">
                  {avatar.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected persona preview */}
      {selectedAvatar && (() => {
        const av = AVATARS.find((a) => a.key === selectedAvatar);
        return av ? (
          <div className={`rounded-xl p-4 bg-gradient-to-r ${av.gradient} text-center animate-bounce_in`}>
            <div className="text-4xl mb-1">{av.emoji}</div>
            <p className="text-white font-semibold text-sm">{av.name}</p>
            <p className="text-white/80 text-xs italic mt-1">"{av.tagline}"</p>
          </div>
        ) : null;
      })()}

      {error && (
        <div className="p-3 rounded-lg bg-red-900/50 border border-red-500/50 text-red-300 text-sm text-center animate-shake">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending || !selectedAvatar}
        className="w-full bg-gold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-pitch-dark font-bebas text-2xl tracking-widest py-4 px-6 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-gold/20"
      >
        {isPending ? "STARTAR..." : "STARTA VM-ÄVENTYRET! ⚽"}
      </button>
    </div>
  );
}
