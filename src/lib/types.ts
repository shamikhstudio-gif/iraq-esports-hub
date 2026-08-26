export type UserRole = 'player' | 'team_leader' | 'admin';

export interface Profile {
  id: string;
  auth_user_id?: string | null;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string | null;
  banner_url?: string | null;
  bio?: string | null;
  role: UserRole;
  primary_game: string;
  secondary_games?: string[];
  in_game_id?: string | null;
  in_game_role?: string | null;
  city: string;
  team_id?: string | null;
  is_verified: boolean;
  is_banned: boolean;
  is_suspended: boolean;
  suspended_until?: string | null;
  suspension_reason?: string | null;
  warning_count: number;
  xp?: number;
  level?: number;
  last_checkin_date?: string | null;
  ebits_balance?: number;
  boost_cards_count?: number;
  ultra_hd_cards_count?: number;
  created_at: string;
  team?: Team | null;
}

export interface TeamRole {
  id: string;
  team_id: string;
  name: string;
  color: string;
  permissions: string[];
  priority: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role_id?: string | null;
  in_game_title: string;
  is_starter: boolean;
  joined_at: string;
  user?: Profile;
  role?: TeamRole;
}

export interface TeamJoinRequest {
  id: string;
  team_id: string;
  user_id: string;
  game: string;
  in_game_id: string;
  rank: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  user?: Profile;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id?: string | null;
  receiver_team_id?: string | null;
  sender_team_id?: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
  receiver_team?: Team;
  sender_team?: Team;
}

export interface TeamMatch {
  id: string;
  team_id: string;
  opponent_name: string;
  opponent_logo?: string;
  opponent_team_id?: string | null;
  opponent_team?: Team;
  team?: Team;
  game: string;
  result?: 'win' | 'loss' | 'draw';
  score: string;
  our_score?: number;
  opponent_score?: number;
  notes?: string;
  match_date: string;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  logo_url?: string | null;
  banner_url?: string | null;
  bio?: string | null;
  city: string;
  games: string[];
  captain_id?: string | null;
  owner_id?: string | null;
  is_verified: boolean;
  rules?: string[];
  is_exclusive?: boolean;
  recruitment_status?: 'open' | 'invite_only' | 'closed';
  min_rank?: string;
  voice_chat_required?: boolean;
  discord_url?: string;
  achievements?: { title: string; year: string }[];
  current_streak?: number;
  last_match_date?: string | null;
  ebits_balance?: number;
  entry_splash_config?: {
    text?: string;
    font?: string;
    text_gradient?: string[];
    image_url?: string | null;
    animation_type?: 'zoom' | 'glitch' | 'scanline' | 'flip' | 'fade';
    backdrop_type?: 'blur' | 'color' | 'gradient';
    backdrop_color?: string;
    backdrop_blur?: number;
    duration?: number;
    sound?: boolean;
  } | null;
  created_at: string;
  members_count?: number;
  roles?: TeamRole[];
  members?: TeamMember[];
  captain?: Profile;
}

export interface Post {
  id: string;
  author_id: string;
  team_id?: string | null;
  content: string;
  media_urls?: string[];
  post_type: 'general' | 'scrim' | 'recruitment' | 'announcement';
  game?: string;
  is_pinned?: boolean;
  likes_count: number;
  comments_count: number;
  is_boosted?: boolean;
  is_ultra_hd?: boolean;
  created_at: string;
  author?: Profile;
  team?: Team;
  is_liked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  type: 'new_follower' | 'first_warning' | 'account_suspended' | 'general' | 'message' | 'team_invite' | 'team_application';
  title: string;
  description: string;
  actor_id?: string | null;
  suspension_days?: number | null;
  suspension_reason?: string | null;
  support_dispatched?: boolean;
  link_url?: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  type: string;
  subject: string;
  message: string;
  status: 'pending' | 'resolved' | 'rejected';
  admin_notes?: string | null;
  created_at: string;
  user?: Profile;
}

export interface ScrimLobby {
  id: string;
  host_team_id: string;
  guest_team_id?: string | null;
  reported_by_team_id?: string | null;
  game: string;
  format: string; // '5v5 BO1', '5v5 BO3', '3v3', '2v2', etc.
  server_region: string; // 'Bahrain', 'Dubai', 'Frankfurt', etc.
  min_rank?: string | null;
  scheduled_time: string;
  status: 'open' | 'accepted' | 'in_progress' | 'pending_verification' | 'completed' | 'cancelled';
  room_code?: string | null;
  discord_channel?: string | null;
  selected_map?: string | null;
  banned_maps?: string[];
  host_ready?: boolean;
  guest_ready?: boolean;
  host_score?: number | null;
  guest_score?: number | null;
  notes?: string | null;
  created_at: string;
  host_team?: Team;
  guest_team?: Team;
  challenges?: ScrimChallenge[];
}

export interface ScrimChallenge {
  id: string;
  lobby_id: string;
  challenger_team_id: string;
  host_team_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  challenger_team?: Team;
  host_team?: Team;
}

export interface ScrimMercenary {
  id: string;
  user_id: string;
  game: string;
  role?: string | null;
  rank?: string | null;
  is_available: boolean;
  expires_at: string;
  created_at: string;
  user?: Profile;
}