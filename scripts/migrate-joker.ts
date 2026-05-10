/**
 * Adds the Joker powerup to the database.
 *
 * Run ONCE in Supabase SQL editor first:
 *   ALTER TYPE powerup_type ADD VALUE IF NOT EXISTS 'joker';
 *
 * Then run this script to:
 *   1. Give all existing users 1 Joker
 *   2. Create the joker_steals tracking table
 *
 * Usage: npm run migrate:joker
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  console.log("=== migrate-joker ===");

  // 1. Fetch all user IDs
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("user_id");

  if (pErr) { console.error("Failed to fetch profiles:", pErr.message); process.exit(1); }
  if (!profiles?.length) { console.log("No profiles found."); return; }

  console.log(`Giving 1 Joker to ${profiles.length} user(s)...`);

  const rows = profiles.map((p) => ({
    user_id: p.user_id,
    powerup_type: "joker" as const,
    quantity: 1,
    updated_at: new Date().toISOString(),
  }));

  const { error: insertErr } = await supabase
    .from("user_powerups")
    .upsert(rows, { onConflict: "user_id,powerup_type" });

  if (insertErr) {
    console.error("Failed to upsert joker powerups:", insertErr.message);
    console.log("\nIMPORTANT: Run this in Supabase SQL editor FIRST:");
    console.log("  ALTER TYPE powerup_type ADD VALUE IF NOT EXISTS 'joker';");
    process.exit(1);
  }

  console.log(`✅ Done — ${profiles.length} user(s) now have 1 Joker.`);
  console.log("\nNext: update your initialize_user_powerups SQL function to include joker.");
  console.log("Add this line inside the function body:");
  console.log("  INSERT INTO user_powerups (user_id, powerup_type, quantity)");
  console.log("  VALUES (p_user_id, 'joker', 1)");
  console.log("  ON CONFLICT (user_id, powerup_type) DO NOTHING;");
  console.log("\n=== done ===");
}

main().catch((e) => { console.error(e); process.exit(1); });
