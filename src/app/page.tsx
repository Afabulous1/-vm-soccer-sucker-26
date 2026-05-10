import Link from "next/link";

const FEATURES = [
  { emoji: "🏆", text: "Turnerings­gissningar — vem vinner VM?" },
  { emoji: "⚽", text: "Matchgissningar — varje match, varje mål" },
  { emoji: "🔥", text: "Kaosgissningar — 10 000p om du har rätt" },
  { emoji: "✨", text: "Superkrafter — dubbla dina poäng" },
  { emoji: "🏟️", text: "Live ligatabell med dina kompisar" },
];

export default function Home() {
  return (
    <div className="pitch-bg min-h-screen flex items-center justify-center p-4">
      {/* Subtle pitch grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 60px)," +
            "repeating-linear-gradient(90deg,#fff,#fff 1px,transparent 1px,transparent 60px)",
        }}
      />

      <div className="relative text-center max-w-md w-full space-y-8">
        {/* Hero */}
        <div>
          <div className="text-7xl mb-4">⚽</div>
          <h1 className="font-bebas text-5xl sm:text-7xl text-gold tracking-widest leading-none mb-3">
            VM SOCCER<br />SUCKER 26
          </h1>
          <p className="text-green-300 text-base">
            Tävla med kompisarna om att gissa VM 2026 —<br />
            <span className="text-gold font-semibold">för ära och heder.</span>
          </p>
        </div>

        {/* Feature list */}
        <div className="rounded-2xl border border-pitch-light/20 bg-pitch/50 p-5 text-left space-y-2.5">
          {FEATURES.map((f) => (
            <div key={f.text} className="flex items-center gap-3">
              <span className="text-xl shrink-0">{f.emoji}</span>
              <span className="text-green-300 text-sm">{f.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href="/auth"
            className="block bg-gold hover:bg-yellow-400 text-pitch-dark font-bebas text-2xl tracking-widest px-10 py-4 rounded-xl transition-all duration-200 active:scale-95 shadow-lg shadow-gold/25"
          >
            SKAPA KONTO &amp; BÖRJA GISSA 🚀
          </Link>
          <p className="text-green-700 text-xs">
            Gratis · Ingen prestige · Du förlorar ändå 😏
          </p>
        </div>

        {/* Dates */}
        <div className="flex justify-center gap-6 text-xs text-green-700">
          <span>📅 Gissningar öppnar <strong className="text-green-500">1 juni</strong></span>
          <span>🔒 Låser <strong className="text-green-500">11 juni</strong></span>
        </div>
      </div>
    </div>
  );
}
