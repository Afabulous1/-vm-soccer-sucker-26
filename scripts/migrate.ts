/**
 * Run once to add first_scorer column to matches table.
 * Usage: npm run db:migrate
 */
import { supabase } from "./_client.js";

async function main() {
  console.log("Running migration: add first_scorer to matches...");

  const { error } = await supabase.rpc("exec_sql" as never, {
    sql: "ALTER TABLE matches ADD COLUMN IF NOT EXISTS first_scorer text;",
  } as never);

  if (error) {
    // Supabase JS client doesn't expose raw SQL — fall back to hint
    console.warn("Could not run via RPC. Run this SQL manually in Supabase SQL editor:");
    console.log("\n  ALTER TABLE matches ADD COLUMN IF NOT EXISTS first_scorer text;\n");
  } else {
    console.log("Migration complete.");
  }
}

main().catch(console.error);
