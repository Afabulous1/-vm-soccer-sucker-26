export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SuggestionTier = "safe" | "devil" | "crazy";
export type BetCategory = "turnering" | "match" | "kaos";
export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";
export type PowerupType =
  | "double_or_nothing"
  | "taktikgeniet"
  | "sexpoangaren";
export type ShieldType = "forsakringen" | "tidsmaskinen";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          avatar_key: string;
          points_total: number;
          suggestion_personality: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          avatar_key: string;
          points_total?: number;
          suggestion_personality?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          avatar_key?: string;
          points_total?: number;
          suggestion_personality?: string | null;
          updated_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          external_id: number;
          home_team: string;
          away_team: string;
          kickoff_at: string;
          status: MatchStatus;
          home_score: number | null;
          away_score: number | null;
          stage: string;
          group_name: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          external_id: number;
          home_team: string;
          away_team: string;
          kickoff_at: string;
          status?: MatchStatus;
          home_score?: number | null;
          away_score?: number | null;
          stage: string;
          group_name?: string | null;
          updated_at?: string;
        };
        Update: {
          status?: MatchStatus;
          home_score?: number | null;
          away_score?: number | null;
          updated_at?: string;
        };
      };
      bets: {
        Row: {
          id: string;
          user_id: string;
          bet_type: string;
          bet_category: BetCategory;
          match_id: string | null;
          bet_value: Json;
          points_wager: number;
          power_up_used: PowerupType | null;
          shield_used: ShieldType | null;
          suggestion_tier: SuggestionTier | null;
          is_correct: boolean | null;
          points_awarded: number | null;
          locked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bet_type: string;
          bet_category: BetCategory;
          match_id?: string | null;
          bet_value: Json;
          points_wager: number;
          power_up_used?: PowerupType | null;
          shield_used?: ShieldType | null;
          suggestion_tier?: SuggestionTier | null;
          is_correct?: boolean | null;
          points_awarded?: number | null;
          locked_at?: string | null;
          created_at?: string;
        };
        Update: {
          is_correct?: boolean | null;
          points_awarded?: number | null;
          locked_at?: string | null;
        };
      };
      leaderboard_cache: {
        Row: {
          user_id: string;
          username: string;
          avatar_key: string;
          points_total: number;
          weekly_points: number;
          current_streak: number;
          badges: Json;
          rank: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          username: string;
          avatar_key: string;
          points_total?: number;
          weekly_points?: number;
          current_streak?: number;
          badges?: Json;
          rank?: number;
          updated_at?: string;
        };
        Update: {
          username?: string;
          avatar_key?: string;
          points_total?: number;
          weekly_points?: number;
          current_streak?: number;
          badges?: Json;
          rank?: number;
          updated_at?: string;
        };
      };
      trash_talk: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          avatar_key: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          avatar_key: string;
          message: string;
          created_at?: string;
        };
        Update: never;
      };
      user_powerups: {
        Row: {
          user_id: string;
          powerup_type: PowerupType | ShieldType;
          quantity: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          powerup_type: PowerupType | ShieldType;
          quantity?: number;
          updated_at?: string;
        };
        Update: {
          quantity?: number;
          updated_at?: string;
        };
      };
      suggestion_stats: {
        Row: {
          user_id: string;
          safe_count: number;
          devil_count: number;
          crazy_count: number;
          safe_correct: number;
          devil_correct: number;
          crazy_correct: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          safe_count?: number;
          devil_count?: number;
          crazy_count?: number;
          safe_correct?: number;
          devil_correct?: number;
          crazy_correct?: number;
          updated_at?: string;
        };
        Update: {
          safe_count?: number;
          devil_count?: number;
          crazy_count?: number;
          safe_correct?: number;
          devil_correct?: number;
          crazy_correct?: number;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      suggestion_tier: SuggestionTier;
      bet_category: BetCategory;
      match_status: MatchStatus;
    };
  };
}
