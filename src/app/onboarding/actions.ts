"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AVATARS } from "@/lib/avatars";

interface CreateProfileInput {
  username: string;
  avatarKey: string;
}

interface ActionResult {
  success?: boolean;
  error?: string;
}

export async function createProfile(
  input: CreateProfileInput
): Promise<ActionResult> {
  const { username, avatarKey } = input;

  if (!username || username.trim().length < 2 || username.trim().length > 20) {
    return { error: "Användarnamnet måste vara 2–20 tecken." };
  }

  const cleanUsername = username.trim();

  if (!/^[a-zA-Z0-9_\-åäöÅÄÖ ]+$/.test(cleanUsername)) {
    return {
      error: "Endast bokstäver, siffror, mellanslag och _ - är tillåtna.",
    };
  }

  const validAvatar = AVATARS.find((a) => a.key === avatarKey);
  if (!validAvatar) {
    return { error: "Välj en avatar!" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Du måste vara inloggad." };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    user_id: user.id,
    username: cleanUsername,
    avatar_key: avatarKey,
  });

  if (profileError) {
    if (profileError.code === "23505") {
      return { error: "Det användarnamnet är redan taget. Försök ett annat!" };
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
  if (!username || username.trim().length < 2) return { available: false };

  // Admin client needed: profiles are not publicly readable after security tightening
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", username.trim()) // case-insensitive match
    .single();

  return { available: !data };
}
