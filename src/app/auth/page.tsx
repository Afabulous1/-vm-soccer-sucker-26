"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getBaseUrl } from "@/lib/utils";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${getBaseUrl()}/auth/callback`,
      },
    });

    if (error) {
      setError("Något gick fel. Kontrollera din e-post och försök igen.");
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getBaseUrl()}/auth/callback`,
      },
    });

    if (error) {
      setError("Inloggning med Google misslyckades. Försök igen.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="pitch-bg min-h-screen flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-pitch opacity-40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-pitch-light opacity-30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-3">⚽</div>
          <h1 className="font-bebas text-5xl sm:text-6xl text-gold tracking-widest">
            VM SOCCER SUCKER 26
          </h1>
          <p className="mt-2 text-green-300 text-sm">
            Tippa VM 2026 med kompisgänget — för ära och heder!
          </p>
        </div>

        {/* Card */}
        <div className="bg-pitch/80 backdrop-blur-sm border border-pitch-light/40 rounded-2xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="font-bebas text-3xl text-gold mb-2">
                KOLLA INKORGEN!
              </h2>
              <p className="text-green-300 text-sm leading-relaxed">
                Vi har skickat en magisk länk till{" "}
                <span className="text-white font-semibold">{email}</span>.
                Klicka på länken för att logga in!
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-6 text-green-400 text-sm underline underline-offset-2"
              >
                Använd en annan e-post
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-bebas text-3xl text-white text-center mb-6 tracking-wide">
                LOGGA IN FÖR ATT BÖRJA TIPPA
              </h2>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-500/50 text-red-300 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Magic link form */}
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-green-300 text-xs font-semibold mb-1 uppercase tracking-wider"
                  >
                    E-postadress
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ditt@email.se"
                    className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-4 py-3 text-white placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-gold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-pitch-dark font-bold py-3 px-6 rounded-lg transition-all duration-200 active:scale-95 font-bebas text-xl tracking-widest"
                >
                  {loading ? "SKICKAR..." : "🔮 SKICKA MAGISK LÄNK"}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-pitch-light/30" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-pitch px-3 text-green-500 text-sm">
                    eller
                  </span>
                </div>
              </div>

              {/* Google OAuth */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200 active:scale-95"
              >
                {googleLoading ? (
                  <span className="text-gray-600">Omdirigerar...</span>
                ) : (
                  <>
                    <GoogleIcon />
                    <span>Fortsätt med Google</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

        <p className="text-center text-green-700 text-xs mt-6">
          Inget konto behövs — logga bara in så sätter vi igång! 🚀
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
