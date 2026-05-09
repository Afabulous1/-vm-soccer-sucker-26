import Link from "next/link";

export default function Home() {
  return (
    <div className="pitch-bg min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="text-8xl mb-4">⚽</div>
        <h1 className="font-bebas text-6xl sm:text-7xl text-gold tracking-widest mb-2">
          VM SOCCER SUCKER 26
        </h1>
        <p className="text-green-300 text-lg mb-8">
          Gissa VM 2026 med kompisgänget — för ära och heder!
        </p>
        <Link
          href="/auth"
          className="inline-block bg-gold hover:bg-yellow-400 text-pitch-dark font-bebas text-2xl tracking-widest px-10 py-4 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-gold/20"
        >
          BÖRJA GISSA NU 🚀
        </Link>
        <p className="text-green-700 text-xs mt-6">
          Gratis · Bara för skojs skull · VM 2026
        </p>
      </div>
    </div>
  );
}
