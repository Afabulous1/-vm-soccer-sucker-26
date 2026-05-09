"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { deriveEmail, validateUsername } from "@/lib/utils";

interface SignUpResult {
  email?: string;
  error?: string;
}

export async function signUpUser(
  username: string,
  password: string
): Promise<SignUpResult> {
  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError };

  if (password.length < 6)
    return { error: "Lösenordet måste vara minst 6 tecken." };

  const admin = createAdminClient();

  // Check username uniqueness before creating auth user
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", username.trim())
    .single();

  if (existing)
    return { error: "Det spelarnamnet är redan taget. Välj ett annat!" };

  const email = deriveEmail(username);

  // Create user via admin API — bypasses email validation, SMTP, and
  // confirmation flow entirely. email_confirm: true marks it as verified.
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: username.trim() },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already exists") ||
      error.message.toLowerCase().includes("unique")
    ) {
      return { error: "Det spelarnamnet är redan taget. Välj ett annat!" };
    }
    return { error: `Registrering misslyckades: ${error.message}` };
  }

  return { email };
}
