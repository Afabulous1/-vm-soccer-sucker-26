import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pitch-bg min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-4">🟥</div>
        <h1 className="font-bebas text-8xl text-gold tracking-widest mb-1">404</h1>
        <h2 className="font-bebas text-3xl text-white tracking-widest mb-3">
          OFFSIDE!
        </h2>
        <p className="text-green-300 mb-8">
          Sidan du letade efter finns inte. Domaren blåste av — du var offside.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-gold hover:bg-yellow-400 text-pitch-dark font-bebas text-2xl tracking-widest px-10 py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-gold/20"
        >
          TILLBAKA TILL PLANEN
        </Link>
      </div>
    </div>
  );
}
