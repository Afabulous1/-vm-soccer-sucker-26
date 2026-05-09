"use client";

import { useEffect } from "react";

export default function BetsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="pitch-bg min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-3">🚨</div>
        <h2 className="font-bebas text-4xl text-rose-400 tracking-widest mb-2">
          GISSNING KRASCHADE
        </h2>
        <p className="text-green-300 text-sm mb-5">
          Något gick snett. Dina sparade gissningar är säkra — ladda om och försök igen.
        </p>
        <button
          onClick={reset}
          className="bg-rose-600 hover:bg-rose-500 text-white font-bebas text-xl tracking-widest px-8 py-3 rounded-xl transition-all active:scale-95"
        >
          LADDA OM
        </button>
      </div>
    </div>
  );
}
