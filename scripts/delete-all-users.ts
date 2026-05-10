/**
 * Deletes ALL users from Supabase Auth (and cascades to profiles, bets, etc.).
 * Use to clean up test accounts before opening to real users.
 *
 * Usage: npm run delete:users
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
  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) { console.error("Failed to list users:", error.message); process.exit(1); }

  if (!users.length) { console.log("No users found — nothing to delete."); return; }

  console.log(`Deleting ${users.length} user(s)...`);
  let deleted = 0;

  for (const user of users) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.warn(`  ✗ ${user.id}: ${delErr.message}`);
    } else {
      console.log(`  ✓ Deleted: ${user.id}`);
      deleted++;
    }
  }

  console.log(`\nDone. ${deleted}/${users.length} users deleted.`);
  console.log("Profiles, bets, and power-ups cascade-deleted automatically.");
}

main();
