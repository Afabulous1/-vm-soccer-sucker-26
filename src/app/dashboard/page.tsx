import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_key, points_total")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  return (
    <div className="pitch-bg min-h-screen flex items-center justify-center">
      <div className="text-center p-8">
        <div className="text-7xl mb-4">🚧</div>
        <h1 className="font-bebas text-5xl text-gold tracking-widest mb-2">
          HEJ, {profile.username.toUpperCase()}!
        </h1>
        <p className="text-green-300">
          Dashboarden byggs i fas 7 — du är inloggad och klar!
        </p>
        <p className="text-green-600 text-sm mt-2">
          Poäng: {profile.points_total} 🏆
        </p>
      </div>
    </div>
  );
}
