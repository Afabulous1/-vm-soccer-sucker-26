export function getBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Converts a display username into a deterministic "fake" email used
 * internally by Supabase auth. Users never see this email.
 * Example: "Röde_Ragnar" → "rode_ragnar@vm26.game"
 */
export function deriveEmail(username: string): string {
  return (
    username
      .toLowerCase()
      .replace(/å/g, "a")
      .replace(/ä/g, "a")
      .replace(/ö/g, "o")
      .replace(/[^a-z0-9_-]/g, "") + "@vm26.game"
  );
}

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (trimmed.length < 3) return "Minst 3 tecken krävs.";
  if (trimmed.length > 20) return "Max 20 tecken tillåtna.";
  if (!/^[a-zA-Z0-9åäöÅÄÖ_-]+$/.test(trimmed))
    return "Bara bokstäver, siffror, _ och - är tillåtna.";
  return null;
}
