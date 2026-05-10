"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function grantJoker(): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Inte inloggad" };

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await admin.from("user_powerups").upsert(
    { user_id: user.id, powerup_type: "joker", quantity: 1, updated_at: new Date().toISOString() },
    { onConflict: "user_id,powerup_type" }
  );

  if (error) {
    if (error.message.includes("invalid input value for enum")) {
      return {
        ok: false,
        message: "SQL saknas! Kör detta i Supabase SQL Editor:\nALTER TYPE powerup_type ADD VALUE IF NOT EXISTS 'joker';",
      };
    }
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Joker tillagd! Gå till dashboarden." };
}
