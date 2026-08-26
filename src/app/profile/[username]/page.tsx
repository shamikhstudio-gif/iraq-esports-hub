'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  MapPin, 
  Gamepad2, 
  CheckCircle2, 
  UserPlus, 
  UserCheck, 
  Shield
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Profile, Post } from '@/lib/types';
import { PostCard } from '@/components/PostCard';

export default function ProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (username) fetchProfileData();
  }, [username]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    const { data: profileData } = await supabase
      .from('profiles')
      .select(`
        *,
        team:teams!fk_profiles_team(*)
      `)
      .eq('username', username)
      .single();

    if (profileData) {
      setProfile(profileData as Profile);

      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
      if (savedUserId === profileData.id) {
        setIsCurrentUser(true);
      }

      if (savedUserId) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', savedUserId)
          .eq('following_id', profileData.id)
          .maybeSingle();

        if (followData) setIsFollowing(true);
      }

      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_author_id_fkey(*)
        `)
        .eq('author_id', profileData.id)
        .order('created_at', { ascending: false });

      if (postsData) setPosts(postsData as Post[]);
    }
    setIsLoading(false);
  };

  const handleFollowToggle = async () => {
    if (!profile) return;
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedUserId) {
      alert('يرجى تسجيل الدخول لمتابعة هذا اللاعب');
      return;
    }
    const currentUserId = savedUserId;

    if (isFollowing) {
      setIsFollowing(false);
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profile.id);
    } else {
      setIsFollowing(true);
      await supabase
        .from('follows')
        .insert({
          follower_id: currentUserId,
          following_id: profile.id,
        });

      const { data: followerData } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', currentUserId)
        .single();

      const followerName = followerData?.full_name || 'أحد اللاعبين';

      await supabase
        .from('notifications')
        .insert({
          user_id: profile.id,
          type: 'new_follower',
          title: 'متابع جديد',
          description: `قام اللاعب ${followerName} (@${followerData?.username || ''}) بمتابعة حسابك الشخصي في شبكة بابل.`,
          actor_id: currentUserId,
          is_read: false,
        });
    }
  };

  if (isLoading) {
    return <div className="card-clean p-12 text-center text-xs text-zinc-400 bg-black border-white/10">جاري تحميل الملف الشخصي...</div>;
  }

  if (!profile) {
    return <div className="card-clean p-12 text-center text-xs text-zinc-400 bg-black border-white/10">لم يتم العثور على هذا الحساب.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <div className="card-3d overflow-hidden text-white">
        <div className="h-44 sm:h-56 relative bg-[#050505]">
          <img
            src={profile.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200'}
            alt={profile.full_name}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-16 mb-4 gap-4">
            <div className="flex items-end gap-4">
              <img
                src={profile.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150'}
                alt={profile.full_name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-black shadow-[0_10px_25px_rgba(0,0,0,0.9)] bg-black"
              />
              <div className="mb-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                  {profile.full_name}
                  {profile.is_verified && <CheckCircle2 className="w-5 h-5 text-white" />}
                </h1>
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium mt-0.5">
                  <span className="text-zinc-300">@{profile.username}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    {profile.city}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-white">{profile.role === 'admin' ? 'إدارة IEH' : 'لاعب محترف'}</span>
                </div>
              </div>
            </div>

            {!isCurrentUser && (
              <button
                onClick={handleFollowToggle}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                  isFollowing
                    ? 'btn-3d-dark text-white'
                    : 'btn-3d-primary text-black'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 text-white" />
                    <span>تتابعه بالفعل</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-black" />
                    <span>متابعة اللاعب</span>
                  </>
                )}
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl mb-5 font-normal">
            {profile.bio || 'لاعب مسجل في شبكة IEH للرياضات الإلكترونية في العراق.'}
          </p>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black font-extrabold shadow-sm">
              <Gamepad2 className="w-4 h-4 text-black" />
              <span>اللعبة: {profile.primary_game}</span>
            </div>

            {profile.in_game_role && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#080808] border border-white/10 text-zinc-300">
                <span>المركز: {profile.in_game_role}</span>
              </div>
            )}

            {profile.in_game_id && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#080808] border border-white/10 text-zinc-300 font-mono">
                <span>ID: {profile.in_game_id}</span>
              </div>
            )}

            {profile.team && (
              <Link
                href={`/teams/${profile.team.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15 transition shadow-sm"
              >
                <Shield className="w-4 h-4 text-white" />
                <span>الفريق: {profile.team.name}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
          <span>منشورات وسكريمات {profile.full_name} ({posts.length})</span>
        </h3>

        {posts.length === 0 ? (
          <div className="card-3d p-8 text-center text-xs text-slate-400">
            لم ينشر هذا اللاعب أي منشورات بعد.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}