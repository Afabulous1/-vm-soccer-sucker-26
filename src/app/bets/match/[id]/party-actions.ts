"use server";

import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function getAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export interface MatchPlayer {
  userId: string;
  username: string;
  avatarKey: string;
  hasMatchResultBet: boolean;
  matchResultPick?: string;
  hasTotalGoalsBet: boolean;
  totalGoalsPick?: number;
}

export interface PartyAction {
  id: string;
  actionType: "sabotage" | "punto_bandito";
  targetId: string | null;
  targetUsername: string | null;
  resolved: boolean;
}

export interface PartyInventory {
  sabotage: number;
  puntoBandito: number;
}

export async function getMatchPartyData(matchId: string, isLocked: boolean): Promise<{
  players: MatchPlayer[];
  myActions: PartyAction[];
  inventory: PartyInventory;
  incomingSabotages: number;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { players: [], myActions: [], inventory: { sabotage: 0, puntoBandito: 0 }, incomingSabotages: 0 };

  const admin = getAdmin();

  const [betsRes, profilesRes, actionsRes, inventoryRes, incomingRes] = await Promise.all([
    admin
      .from("bets")
      .select("user_id, bet_type, bet_value")
      .eq("match_id", matchId)
      .eq("bet_category", "match")
      .neq("user_id", user.id),

    admin.from("profiles").select("user_id, username, avatar_key"),

    admin
      .from("party_actions")
      .select("id, action_type, target_id, resolved")
      .eq("match_id", matchId)
      .eq("actor_id", user.id),

    admin
      .from("user_powerups")
      .select("powerup_type, quantity")
      .eq("user_id", user.id)
      .in("powerup_type", ["sabotage", "punto_bandito"]),

    admin
      .from("party_actions")
      .select("id")
      .eq("match_id", matchId)
      .eq("target_id", user.id)
      .eq("action_type", "sabotage"),
  ]);

  const bets = betsRes.data ?? [];
  const profileMap = new Map((profilesRes.data ?? []).map((p: { user_id: string; username: string; avatar_key: string }) => [p.user_id, p]));
  const myRawActions = actionsRes.data ?? [];
  const inventoryRows = inventoryRes.data ?? [];
  const incomingSabotages = (incomingRes.data ?? []).length;

  const playerIds = Array.from(new Set(bets.map((b: { user_id: string }) => b.user_id)));
  const players: MatchPlayer[] = playerIds
    .map((uid) => {
      const profile = profileMap.get(uid);
      if (!profile) return null;
      const userBets = bets.filter((b: { user_id: string }) => b.user_id === uid);
      const matchResultBet = userBets.find((b: { bet_type: string }) => b.bet_type === "match_result");
      const totalGoalsBet = userBets.find((b: { bet_type: string }) => b.bet_type === "total_goals_match");
      const resultVal = matchResultBet?.bet_value as { result?: string } | undefined;
      const goalsVal = totalGoalsBet?.bet_value as { count?: number } | undefined;
      const player: MatchPlayer = {
        userId: uid,
        username: profile.username,
        avatarKey: profile.avatar_key,
        hasMatchResultBet: !!matchResultBet,
        matchResultPick: isLocked ? resultVal?.result : undefined,
        hasTotalGoalsBet: !!totalGoalsBet,
        totalGoalsPick: isLocked ? goalsVal?.count : undefined,
      };
      return player;
    })
    .filter((p): p is MatchPlayer => p !== null);

  const myActions: PartyAction[] = myRawActions.map((a: { id: string; action_type: string; target_id: string | null; resolved: boolean }) => {
    const targetProfile = a.target_id ? profileMap.get(a.target_id) : null;
    return {
      id: a.id,
      actionType: a.action_type as "sabotage" | "punto_bandito",
      targetId: a.target_id,
      targetUsername: targetProfile?.username ?? null,
      resolved: a.resolved,
    };
  });

  const inventory: PartyInventory = {
    sabotage: (inventoryRows.find((r: { powerup_type: string; quantity: number }) => r.powerup_type === "sabotage")?.quantity ?? 0),
    puntoBandito: (inventoryRows.find((r: { powerup_type: string; quantity: number }) => r.powerup_type === "punto_bandito")?.quantity ?? 0),
  };

  return { players, myActions, inventory, incomingSabotages };
}

export async function executeSabotage(matchId: string, targetUserId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inte inloggad" };
  if (targetUserId === user.id) return { ok: false, error: "Du kan inte sabotera dig själv" };

  const admin = getAdmin();

  const { data: inv } = await admin
    .from("user_powerups")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("powerup_type", "sabotage")
    .single();

  if (!inv || inv.quantity < 1) return { ok: false, error: "Du har inga Sabotage-krafter kvar" };

  const { data: match } = await admin
    .from("matches")
    .select("status, kickoff_at")
    .eq("id", matchId)
    .single();

  if (!match) return { ok: false, error: "Match hittades inte" };
  if (match.status === "finished") return { ok: false, error: "Matchen är redan avslutad" };

  const { error: insertErr } = await admin.from("party_actions").insert({
    actor_id: user.id,
    target_id: targetUserId,
    match_id: matchId,
    action_type: "sabotage",
  });

  if (insertErr) {
    if (insertErr.code === "23505") return { ok: false, error: "Du har redan saboterat någon på den här matchen" };
    return { ok: false, error: insertErr.message };
  }

  const { error: deductErr } = await admin
    .from("user_powerups")
    .update({ quantity: inv.quantity - 1, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("powerup_type", "sabotage");

  if (deductErr) {
    await admin.from("party_actions").delete().eq("actor_id", user.id).eq("match_id", matchId).eq("action_type", "sabotage");
    return { ok: false, error: "Kunde inte dra av kraft" };
  }

  return { ok: true };
}

export async function executePuntoBandito(matchId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Inte inloggad" };

  const admin = getAdmin();

  const { data: inv } = await admin
    .from("user_powerups")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("powerup_type", "punto_bandito")
    .single();

  if (!inv || inv.quantity < 1) return { ok: false, error: "Du har inga Punto Bandito-krafter kvar" };

  const { data: match } = await admin
    .from("matches")
    .select("status")
    .eq("id", matchId)
    .single();

  if (!match) return { ok: false, error: "Match hittades inte" };
  if (match.status === "finished") return { ok: false, error: "Matchen är redan avslutad" };

  const { error: insertErr } = await admin.from("party_actions").insert({
    actor_id: user.id,
    target_id: null,
    match_id: matchId,
    action_type: "punto_bandito",
  });

  if (insertErr) {
    if (insertErr.code === "23505") return { ok: false, error: "Du har redan aktiverat Punto Bandito på den här matchen" };
    return { ok: false, error: insertErr.message };
  }

  const { error: deductErr } = await admin
    .from("user_powerups")
    .update({ quantity: inv.quantity - 1, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("powerup_type", "punto_bandito");

  if (deductErr) {
    await admin.from("party_actions").delete().eq("actor_id", user.id).eq("match_id", matchId).eq("action_type", "punto_bandito");
    return { ok: false, error: "Kunde inte dra av kraft" };
  }

  return { ok: true };
}
