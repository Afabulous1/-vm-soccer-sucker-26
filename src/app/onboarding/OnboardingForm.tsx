"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AVATARS } from "@/lib/avatars";
import { createProfile, checkUsername } from "./actions";

export default function OnboardingForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "invalid"
  >("idle");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUsernameChange = useCallback((value: string) => {
    setUsername(value);
    setError(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setUsernameStatus("idle");
      return;
    }

    if (value.trim().length > 20) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    debounceRef.current = setTimeout(async () => {
      const { available } = await checkUsername(value);
      setUsernameStatus(available ? "available" : "taken");
    }, 500);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleSubmit() {
    if (!selectedAvatar) {
      setError("Välj en avatar för att fortsätta!");
      return;
    }
    if (usernameStatus === "taken") {
      setError("Det användarnamnet är redan taget. Välj ett annat!");
      return;
    }
    if (usernameStatus !== "available") {
      setError("Ange ett giltigt användarnamn (2–20 tecken).");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createProfile({
        username,
        avatarKey: selectedAvatar,
      });
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  const statusIndicator = () => {
    if (usernameStatus === "checking")
      return <span className="text-yellow-400 text-xs">Kollar...</span>;
    if (usernameStatus === "available")
      return <span className="text-green-400 text-xs">✓ Tillgängligt!</span>;
    if (usernameStatus === "taken")
      return <span className="text-red-400 text-xs">✗ Redan taget</span>;
    if (usernameStatus === "invalid")
      return <span className="text-red-400 text-xs">Max 20 tecken</span>;
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Username */}
      <div>
        <label className="block text-green-300 text-xs font-semibold mb-1 uppercase tracking-wider">
          Välj ett smeknamn
        </label>
        <div className="relative">
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            maxLength={20}
            placeholder="T.ex. MessisFan99"
            className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-4 py-3 text-white placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition pr-24"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {statusIndicator()}
            <span className="text-green-700 text-xs">{username.length}/20</span>
          </div>
        </div>
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
                onClick={() => {
                  setSelectedAvatar(avatar.key);
                  setError(null);
                }}
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

      {/* Selected persona tagline */}
      {selectedAvatar && (() => {
        const av = AVATARS.find((a) => a.key === selectedAvatar);
        return av ? (
          <div className={`rounded-xl p-4 bg-gradient-to-r ${av.gradient} text-center`}>
            <div className="text-4xl mb-1">{av.emoji}</div>
            <p className="text-white font-semibold text-sm">{av.name}</p>
            <p className="text-white/80 text-xs italic mt-1">"{av.tagline}"</p>
          </div>
        ) : null;
      })()}

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-900/50 border border-red-500/50 text-red-300 text-sm text-center animate-shake">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || usernameStatus === "checking"}
        className="w-full bg-gold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-pitch-dark font-bold py-4 px-6 rounded-xl transition-all duration-200 active:scale-95 font-bebas text-2xl tracking-widest shadow-lg shadow-gold/20"
      >
        {isPending ? "STARTAR..." : "STARTA VM-ÄVENTYRET! ⚽"}
      </button>
    </div>
  );
}
