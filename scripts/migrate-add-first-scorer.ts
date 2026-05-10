/**
 * Adds first_scorer TEXT column to matches table.
 * Run once: npm run migrate:first-scorer
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { error } = await supabase.rpc("exec_sql" as never, {
    sql: "ALTER TABLE matches ADD COLUMN IF NOT EXISTS first_scorer TEXT;",
  } as never);

  if (error) {
    // Try direct approach — exec_sql may not exist, use raw REST
    console.log("RPC not available, trying direct insert to check column...");
    // Try a harmless query that will fail if column doesn't exist
    const { error: selectErr } = await supabase
      .from("matches")
      .select("first_scorer")
      .limit(1);

    if (!selectErr) {
      console.log("✅ Column first_scorer already exists.");
      return;
    }

    console.error("❌ Cannot add column automatically — add it manually in Supabase SQL editor:");
    console.error("   ALTER TABLE matches ADD COLUMN IF NOT EXISTS first_scorer TEXT;");
    process.exit(1);
  }

  console.log("✅ Added first_scorer column to matches.");
}

main();
