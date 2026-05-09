"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
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
      <div className="text-center max-w-md">
        <div className="text-7xl mb-4">💥</div>
        <h1 className="font-bebas text-5xl text-gold tracking-widest mb-2">
          NÅGOT GICK FEL
        </h1>
        <p className="text-green-300 mb-6">
          Planen B: Försök igen. Om det fortfarande kraschar — skyll på Mbappé.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-gold hover:bg-yellow-400 text-pitch-dark font-bebas text-xl tracking-widest px-8 py-3 rounded-xl transition-all active:scale-95"
          >
            FÖRSÖK IGEN
          </button>
          <Link
            href="/dashboard"
            className="bg-pitch-dark border border-pitch-light/40 text-green-300 font-bebas text-xl tracking-widest px-8 py-3 rounded-xl transition-all active:scale-95 hover:border-gold/40"
          >
            TILL DASHBOARD
          </Link>
        </div>
        {error.digest && (
          <p className="text-green-800 text-xs mt-6">Felkod: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
