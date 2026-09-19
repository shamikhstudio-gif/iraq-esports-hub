import { supabase } from '@/lib/supabase';
import type { Team } from '@/lib/types';

/** Fetch all teams, optionally filtered */
export async function fetchTeams(options: {
  search?: string;
  city?: string;
  game?: string;
  limit?: number;
} = {}): Promise<Team[]> {
  const { search, city, game, limit } = options;

  let query = supabase
    .from('teams')
    .select('*')
    .order('created_at', { ascending: false });

  if (city && city !== 'all') query = query.eq('city', city);
  if (game && game !== 'all') query = query.eq('primary_game', game);
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    console.error('fetchTeams error:', error);
    return [];
  }

  let teams = (data as Team[]) ?? [];

  // Client-side search filter (name + tag)
  if (search) {
    const q = search.toLowerCase();
    teams = teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.tag.toLowerCase().includes(q)
    );
  }

  return teams;
}

/** Fetch a single team by ID with full member roster */
export async function fetchTeamById(teamId: string): Promise<Team | null> {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      captain:profiles!teams_captain_id_fkey(*),
      members:team_members(
        *,
        player:profiles(*)
      )
    `)
    .eq('id', teamId)
    .single();

  if (error) {
    console.error('fetchTeamById error:', error);
    return null;
  }
  return data as Team;
}

/** Fetch all teams a user is a member of */
export async function fetchUserTeams(userId: string): Promise<Team[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select('team:teams(*)')
    .eq('player_id', userId)
    .eq('status', 'active');

  if (error) {
    console.error('fetchUserTeams error:', error);
    return [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => row.team).filter(Boolean) as Team[];
}
