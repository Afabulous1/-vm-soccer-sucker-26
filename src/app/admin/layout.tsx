import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin =
    user?.email && adminEmails.includes(user.email.toLowerCase());

  if (!user || !isAdmin) {
    return (
      <div className="pitch-bg min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-4">🔒</div>
          <h1 className="font-bebas text-8xl text-gold tracking-widest mb-1">
            403
          </h1>
          <h2 className="font-bebas text-3xl text-white tracking-widest mb-3">
            ÅTKOMST NEKAD
          </h2>
          <p className="text-green-300 mb-8">
            Du har inte behörighet att se den här sidan. Kontakta admin om du
            tror att detta är ett misstag.
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

  return (
    <div className="pitch-bg min-h-screen">
      <nav className="sticky top-0 z-40 bg-pitch-dark/95 backdrop-blur border-b border-gold/20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bebas text-gold text-2xl tracking-widest">
            🔐 ADMIN PANEL
          </span>
          <Link
            href="/dashboard"
            className="text-green-400 text-sm hover:text-white transition-colors"
          >
            ← Dashboard
          </Link>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">{children}</div>
    </div>
  );
}
