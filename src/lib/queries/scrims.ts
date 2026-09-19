import { supabase } from '@/lib/supabase';
import { ScrimLobby } from '@/lib/types';

export interface FetchScrimsOptions {
  game?: string;
  format?: string;
  status?: string;
  limit?: number;
}

export async function fetchScrimLobbies(options: FetchScrimsOptions = {}): Promise<ScrimLobby[]> {
  const { game, format, status = 'open', limit = 20 } = options;

  let query = supabase
    .from('scrim_lobbies')
    .select(`
      *,
      host_team:teams!scrim_lobbies_host_team_id_fkey(*),
      guest_team:teams!scrim_lobbies_guest_team_id_fkey(*)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (game && game !== 'all') {
    query = query.eq('game', game);
  }
  if (format && format !== 'all') {
    query = query.eq('format', format);
  }
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('fetchScrimLobbies error:', error);
    return [];
  }

  return (data as ScrimLobby[]) ?? [];
}
