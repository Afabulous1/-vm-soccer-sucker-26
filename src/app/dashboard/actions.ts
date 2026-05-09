"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function postTrashTalk(message: string): Promise<{ error?: string }> {
  const msg = message.trim().slice(0, 280);
  if (!msg) return { error: "Skriv något först!" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Inte inloggad." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_key")
    .eq("user_id", user.id)
    .single();

  if (!profile) return { error: "Profil saknas." };

  const { error } = await supabase.from("trash_talk").insert({
    user_id:    user.id,
    username:   profile.username,
    avatar_key: profile.avatar_key,
    message:    msg,
  });

  if (error) return { error: "Kunde inte skicka. Försök igen." };

  revalidatePath("/dashboard");
  return {};
}
