import { supabase } from '@/lib/supabase';
import type { Post } from '@/lib/types';

export interface FetchPostsOptions {
  game?: string;
  postType?: string;
  limit?: number;
  offset?: number;
  currentUserId?: string | null;
}

/**
 * Fetch paginated posts with optional game/type filters.
 * Enriches posts with the caller's like status if currentUserId is provided.
 */
export async function fetchPosts({
  game,
  postType,
  limit = 10,
  offset = 0,
  currentUserId,
}: FetchPostsOptions = {}): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id, username, full_name, avatar_url, is_verified, role, ebits_balance
      ),
      team:teams!posts_team_id_fkey(
        id, name, tag, logo_url
      )
    `)
    .order('is_boosted', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (game && game !== 'all') {
    query = query.eq('game', game);
  }
  if (postType && postType !== 'all') {
    query = query.eq('post_type', postType);
  }

  const { data, error } = await query;
  if (error) {
    console.error('fetchPosts error:', error.message || error);
    return [];
  }

  const posts = (data as Post[]) ?? [];

  // Enrich with like status for the current user
  if (currentUserId && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', currentUserId)
      .in('post_id', postIds);

    const likedSet = new Set((likes ?? []).map((l) => l.post_id));
    return posts.map((p) => ({ ...p, is_liked: likedSet.has(p.id) }));
  }

  return posts;
}

/**
 * Delete a post by ID (only if caller owns it).
 */
export async function deletePost(postId: string, authorId: string): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', authorId);
  return !error;
}

/**
 * Fetch a single post by ID.
 * Enriches with author, team, and caller's like status.
 */
export async function fetchPostById(
  postId: string,
  currentUserId?: string | null
): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(
          id, username, full_name, avatar_url, is_verified, role, ebits_balance, equipped_frame, has_neon_frame
        ),
        team:teams!posts_team_id_fkey(
          id, name, tag, logo_url
        )
      `)
      .eq('id', postId)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('fetchPostById error:', error.message || error);
      return null;
    }

    const post = data as Post;

    if (currentUserId) {
      const { data: like } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .eq('post_id', postId)
        .maybeSingle();

      return { ...post, is_liked: !!like };
    }

    return post;
  } catch (err) {
    console.error('Error in fetchPostById:', err);
    return null;
  }
}
