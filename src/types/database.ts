export type SuggestionTier = "safe" | "devil" | "crazy";
export type BetCategory = "turnering" | "match" | "kaos";
export type MatchStatus = "scheduled" | "live" | "finished" | "postponed";
export type PowerupType =
  | "double_or_nothing"
  | "taktikgeniet"
  | "sexpoangaren"
  | "forsakringen"
  | "tidsmaskinen"
  | "joker";

// Matches Supabase's expected GenericSchema format
export type Database = {
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
          id?: string;
          user_id?: string;
          username?: string;
          avatar_key?: string;
          points_total?: number;
          suggestion_personality?: string | null;
          updated_at?: string;
        };
        Relationships: [];
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
          first_scorer: string | null;
          red_card_count: number | null;
          yellow_card_count: number | null;
          admin_locked: boolean;
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
          first_scorer?: string | null;
          red_card_count?: number | null;
          yellow_card_count?: number | null;
          admin_locked?: boolean;
          stage: string;
          group_name?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          external_id?: number;
          home_team?: string;
          away_team?: string;
          kickoff_at?: string;
          status?: MatchStatus;
          home_score?: number | null;
          away_score?: number | null;
          first_scorer?: string | null;
          red_card_count?: number | null;
          yellow_card_count?: number | null;
          admin_locked?: boolean;
          stage?: string;
          group_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      bets: {
        Row: {
          id: string;
          user_id: string;
          bet_type: string;
          bet_category: BetCategory;
          match_id: string | null;
          bet_value: unknown;
          points_wager: number;
          power_up_used: PowerupType | null;
          shield_used: PowerupType | null;
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
          bet_value: unknown;
          points_wager: number;
          power_up_used?: PowerupType | null;
          shield_used?: PowerupType | null;
          suggestion_tier?: SuggestionTier | null;
          is_correct?: boolean | null;
          points_awarded?: number | null;
          locked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bet_value?: unknown;
          is_correct?: boolean | null;
          points_awarded?: number | null;
          locked_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bets_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
        ];
      };
      leaderboard_cache: {
        Row: {
          user_id: string;
          username: string;
          avatar_key: string;
          points_total: number;
          weekly_points: number;
          current_streak: number;
          badges: unknown;
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
          badges?: unknown;
          rank?: number;
          updated_at?: string;
        };
        Update: {
          username?: string;
          avatar_key?: string;
          points_total?: number;
          weekly_points?: number;
          current_streak?: number;
          badges?: unknown;
          rank?: number;
          updated_at?: string;
        };
        Relationships: [];
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
        Update: Record<string, never>;
        Relationships: [];
      };
      user_powerups: {
        Row: {
          user_id: string;
          powerup_type: PowerupType;
          quantity: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          powerup_type: PowerupType;
          quantity?: number;
          updated_at?: string;
        };
        Update: {
          quantity?: number;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
      };
      admin_outcomes: {
        Row: {
          bet_type: string;
          value_json: Record<string, unknown>;
          source: string;
          notes: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          bet_type: string;
          value_json?: Record<string, unknown>;
          source?: string;
          notes?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          value_json?: Record<string, unknown>;
          source?: string;
          notes?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      initialize_user_powerups: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      suggestion_tier: SuggestionTier;
      bet_category: BetCategory;
      match_status: MatchStatus;
      powerup_type: PowerupType;
    };
    // Note: joker is stored in user_powerups but executed via joker_steals table
    CompositeTypes: { [_ in never]: never };
  };
};

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type Bet = Database["public"]["Tables"]["bets"]["Row"];
export type LeaderboardEntry =
  Database["public"]["Tables"]["leaderboard_cache"]["Row"];
export type TrashTalk = Database["public"]["Tables"]["trash_talk"]["Row"];
export type UserPowerup =
  Database["public"]["Tables"]["user_powerups"]["Row"];
export type SuggestionStats =
  Database["public"]["Tables"]["suggestion_stats"]["Row"];
