"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AVATARS } from "@/lib/avatars";
import { validateUsername } from "@/lib/utils";

interface CreateProfileInput {
  avatarKey: string;
}

interface ActionResult {
  success?: boolean;
  error?: string;
}

export async function createProfile(
  input: CreateProfileInput
): Promise<ActionResult> {
  const { avatarKey } = input;

  if (!AVATARS.find((a) => a.key === avatarKey)) {
    return { error: "Välj en avatar!" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Du måste vara inloggad." };

  // Username was stored in user_metadata at signup
  const username = (user.user_metadata?.username as string | undefined)?.trim();

  const usernameError = validateUsername(username ?? "");
  if (usernameError) return { error: `Ogiltigt spelarnamn: ${usernameError}` };

  const { error: profileError } = await supabase.from("profiles").insert({
    user_id: user.id,
    username: username!,
    avatar_key: avatarKey,
  });

  if (profileError) {
    if (profileError.code === "23505") {
      return {
        error:
          "Det spelarnamnet är redan taget. Logga ut och skapa ett nytt konto med ett annat namn.",
      };
    }
    return { error: "Något gick fel. Försök igen!" };
  }

  // Initialize powerups via admin client (bypasses RLS)
  const admin = createAdminClient();
  await admin.rpc("initialize_user_powerups", { p_user_id: user.id });

  return { success: true };
}

export async function checkUsername(
  username: string
): Promise<{ available: boolean }> {
  if (!username || username.trim().length < 3) return { available: false };

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", username.trim())
    .single();

  return { available: !data };
}
