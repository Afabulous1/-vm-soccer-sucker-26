import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  // Already has a profile — go to dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (profile) redirect("/dashboard");

  return (
    <div className="pitch-bg min-h-screen py-12 px-4">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-pitch opacity-40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-pitch-light opacity-30 blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">🏟️</div>
          <h1 className="font-bebas text-5xl sm:text-6xl text-gold tracking-widest">
            VÄLJ DIN PERSONA!
          </h1>
          <p className="mt-2 text-green-300 text-sm">
            Vem är du på läktaren? Välj klokt — du lever med det ett helt VM.
          </p>
        </div>

        {/* Card */}
        <div className="bg-pitch/80 backdrop-blur-sm border border-pitch-light/40 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <OnboardingForm />
        </div>

        <p className="text-center text-green-700 text-xs mt-6">
          Du kan byta namn och avatar en gång per vecka efteråt.
        </p>
      </div>
    </div>
  );
}
