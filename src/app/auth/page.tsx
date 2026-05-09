"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deriveEmail, validateUsername } from "@/lib/utils";

type Mode = "signup" | "signin";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabaseInfo, setSupabaseInfo] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const usernameError = validateUsername(username);
    if (usernameError) { setError(usernameError); return; }

    if (password.length < 6) {
      setError("Lösenordet måste vara minst 6 tecken.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Lösenorden matchar inte.");
      return;
    }

    setLoading(true);
    const email = deriveEmail(username);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: username.trim() } },
      });

      if (signUpError) {
        if (
          signUpError.message.toLowerCase().includes("already registered") ||
          signUpError.message.toLowerCase().includes("already exists")
        ) {
          setError("Det spelarnamnet är redan taget. Välj ett annat!");
        } else {
          setError("Något gick fel vid registrering. Försök igen.");
        }
        setLoading(false);
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError("Fel spelarnamn eller lösenord. Försök igen.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="pitch-bg min-h-screen flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-pitch opacity-40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-pitch-light opacity-30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
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

          {/* Mode toggle */}
          <div className="flex rounded-xl bg-pitch-dark border border-pitch-light/30 p-1 mb-6">
            {(["signup", "signin"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m
                    ? "bg-gold text-pitch-dark"
                    : "text-green-400 hover:text-white"
                }`}
              >
                {m === "signup" ? "Ny spelare" : "Logga in"}
              </button>
            ))}
          </div>

          {/* Privacy note — signup only */}
          {mode === "signup" && (
            <div className="flex items-start gap-2 mb-5 p-3 rounded-lg bg-green-900/30 border border-green-700/40 text-green-300 text-xs">
              <span className="text-base leading-none mt-0.5">🔒</span>
              <p>
                <strong>Ingen e-post behövs.</strong> Du loggar in med bara
                ditt spelarnamn och lösenord. Dina uppgifter delas aldrig
                med andra spelare.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-500/50 text-red-300 text-sm text-center animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-green-300 text-xs font-semibold mb-1 uppercase tracking-wider">
                Spelarnamn
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(null); }}
                required
                maxLength={20}
                placeholder={mode === "signup" ? "T.ex. Evige_Svensson" : "Ditt spelarnamn"}
                autoComplete="username"
                className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-4 py-3 text-white placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition"
              />
              {mode === "signup" && (
                <p className="mt-1 text-green-600 text-xs">
                  Bokstäver, siffror, _ och - · 3–20 tecken
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-green-300 text-xs font-semibold mb-1 uppercase tracking-wider">
                Lösenord
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  required
                  minLength={6}
                  placeholder="Minst 6 tecken"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-4 py-3 text-white placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 hover:text-green-300 text-sm"
                  tabIndex={-1}
                >
                  {showPassword ? "Dölj" : "Visa"}
                </button>
              </div>
            </div>

            {/* Confirm password — signup only */}
            {mode === "signup" && (
              <div>
                <label className="block text-green-300 text-xs font-semibold mb-1 uppercase tracking-wider">
                  Bekräfta lösenord
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  required
                  placeholder="Upprepa lösenordet"
                  autoComplete="new-password"
                  className="w-full bg-pitch-dark border border-pitch-light/50 rounded-lg px-4 py-3 text-white placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold/50 transition"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-pitch-dark font-bebas text-xl tracking-widest py-3 px-6 rounded-lg transition-all duration-200 active:scale-95 mt-2"
            >
              {loading
                ? "LADDAR..."
                : mode === "signup"
                ? "SKAPA KONTO & BÖRJA TIPPA ⚽"
                : "LOGGA IN →"}
            </button>
          </form>

          {/* Forgot password hint */}
          {mode === "signin" && (
            <p className="text-center text-green-600 text-xs mt-4">
              Glömt lösenordet? Kontakta den som bjöd in dig så kan de återställa ditt konto.
            </p>
          )}
        </div>

        {/* Supabase trust badge */}
        <div className="mt-4 rounded-xl border border-pitch-light/30 bg-pitch/60 p-4">
          <button
            type="button"
            onClick={() => setSupabaseInfo((v) => !v)}
            className="w-full flex items-center justify-between text-green-400 text-xs"
          >
            <span className="flex items-center gap-2">
              <span>🔐</span>
              <span>Inloggningen hanteras av <strong className="text-green-300">Supabase</strong> — vad är det?</span>
            </span>
            <span className="text-green-600">{supabaseInfo ? "▲" : "▼"}</span>
          </button>

          {supabaseInfo && (
            <div className="mt-3 text-green-400 text-xs space-y-2 border-t border-pitch-light/20 pt-3">
              <p>
                <strong className="text-green-300">Supabase</strong> är en välkänd och
                pålitlig autentiseringstjänst som används av tusentals applikationer
                världen över — ungefär som att din dörr har ett riktigt lås istället
                för ett hemmagjort.
              </p>
              <p>
                När du skapar ett konto ser du möjligtvis "Supabase" i webbläsaren
                eller i en bekräftelsemejl. Det är helt normalt och en del av
                hur den här appen håller ditt konto säkert.
              </p>
              <p>
                <strong className="text-green-300">Ditt spelarnamn och lösenord</strong> är
                allt som behövs — din e-post sparas aldrig i appen och syns
                aldrig för andra spelare.
              </p>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-gold underline underline-offset-2 mt-1"
              >
                Läs mer om Supabase →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
