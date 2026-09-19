'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/lib/navigation';
import Link from '@/lib/navigation';
import { 
  MapPin, 
  Gamepad2, 
  CheckCircle2, 
  UserPlus, 
  UserCheck, 
  Shield,
  Mail,
  Palette,
  Radio,
  Moon,
  Circle,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Profile, Post } from '@/lib/types';
import { PostCard } from '@/components/PostCard';
import { AvatarWithDecoration } from '@/components/ui/AvatarWithDecoration';
import { ProfileEffectOverlay } from '@/components/profile/ProfileEffectOverlay';
import { BannerFxOverlay } from '@/components/profile/BannerFxOverlay';
import { ProfileStudioModal, PRESTIGE_BADGES_CATALOG } from '@/components/profile/ProfileStudioModal';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('studio=open')) {
      setIsStudioOpen(true);
    }
  }, []);

  useEffect(() => {
    if (username) fetchProfileData();
  }, [username]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    const cleanUsername = decodeURIComponent(username || '').trim();

    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUsername);
      let query = supabase.from('profiles').select('*');
      if (isUuid) {
        query = query.or(`id.eq.${cleanUsername},username.ilike.${cleanUsername}`);
      } else {
        query = query.ilike('username', cleanUsername);
      }

      const { data: profileData } = await query.maybeSingle();

      if (profileData) {
        const fullProfile = { ...(profileData as Profile) };

        if (profileData.team_id) {
          const { data: teamData } = await supabase
            .from('teams')
            .select('*')
            .eq('id', profileData.team_id)
            .maybeSingle();
          if (teamData) {
            fullProfile.team = teamData;
          }
        }

        setProfile(fullProfile);

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
      } else {
        setProfile(null);
      }
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
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
          message: `قام اللاعب ${followerName} (@${followerData?.username || ''}) بمتابعة حسابك الشخصي في شبكة IEH.`,
          actor_id: currentUserId,
          link_url: `/profile/${followerData?.username || ''}`,
          is_read: false,
        });
    }
  };

  const handleSendMessage = () => {
    if (!profile) return;
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedUserId) {
      alert('يرجى تسجيل الدخول لمراسلة هذا الحساب');
      return;
    }
    router.push(`/messages?recipientId=${profile.id}`);
  };

  if (isLoading) {
    return <div className="card-clean p-12 text-center text-xs text-zinc-400 bg-black border-white/10">جاري تحميل الملف الشخصي...</div>;
  }

  if (!profile) {
    return <div className="card-clean p-12 text-center text-xs text-zinc-400 bg-black border-white/10">لم يتم العثور على هذا الحساب.</div>;
  }

  const renderStatusIcon = (type?: string) => {
    switch (type) {
      case 'in_game':
        return <Gamepad2 className="w-3.5 h-3.5 text-white" />;
      case 'streaming':
        return <Radio className="w-3.5 h-3.5 text-white animate-pulse" />;
      case 'dnd':
        return <Moon className="w-3.5 h-3.5 text-white" />;
      case 'online':
      default:
        return <Circle className="w-2.5 h-2.5 fill-white text-white" />;
    }
  };

  const featuredBadgeObj = PRESTIGE_BADGES_CATALOG.find(
    (b) => b.id === profile.featured_badge && b.id !== 'none'
  );

  return (
    <div className="layout-container py-4 space-y-6">
      <div className="card-3d overflow-hidden text-white relative">
        {/* Profile Canvas Ambient Effect */}
        <ProfileEffectOverlay effect={profile.equipped_effect || 'none'} />

        {/* Banner with FX */}
        <div className="h-44 sm:h-56 relative bg-[#050505] overflow-hidden">
          <img
            src={profile.banner_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200'}
            alt={profile.full_name}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <BannerFxOverlay fx={profile.equipped_banner_fx || 'none'} />
        </div>

        <div className="p-6 pt-0 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-16 mb-4 gap-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                <AvatarWithDecoration
                  src={profile.avatar_url || ''}
                  alt={profile.full_name}
                  frame={profile.equipped_frame || (profile.has_neon_frame ? 'neon_pulse' : 'none')}
                  size="2xl"
                  showBadge={true}
                />
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                    {profile.full_name}
                    {profile.is_verified && <CheckCircle2 className="w-5 h-5 text-white" />}
                  </h1>

                  {/* Featured Prestige Badge */}
                  {featuredBadgeObj && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-black text-[11px] font-black shadow-md animate-in zoom-in-50">
                      {featuredBadgeObj.icon}
                      <span>{featuredBadgeObj.nameAr}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium mt-1 flex-wrap">
                  <span className="text-zinc-300 font-mono">@{profile.username}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-400" />
                    {profile.city}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-white">{profile.role === 'admin' ? 'إدارة IEH' : 'لاعب محترف'}</span>
                </div>

                {/* Custom Status Motto */}
                {profile.custom_status && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-white/10 border border-white/15 text-xs text-white mt-2 font-bold backdrop-blur-md">
                    {renderStatusIcon(profile.custom_status_type)}
                    <span>{profile.custom_status}</span>
                  </div>
                )}
              </div>
            </div>

            {isCurrentUser ? (
              <button
                onClick={() => setIsStudioOpen(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 bg-white text-black hover:bg-zinc-200 transition shadow-lg shrink-0"
              >
                <Palette className="w-4 h-4 text-black" />
                <span>استوديو التخصيص</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                <button
                  onClick={handleSendMessage}
                  className="px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 btn-3d-primary text-black transition shadow-lg shrink-0 active:scale-95"
                  title="إرسال رسالة فورية لهذا الحساب"
                >
                  <MessageSquare className="w-4 h-4 text-black" />
                  <span>مراسلة اللاعب</span>
                </button>

                <button
                  onClick={handleFollowToggle}
                  className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shrink-0 ${
                    isFollowing
                      ? 'btn-3d-dark text-white'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 text-white" />
                      <span>تتابعه بالفعل</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-white" />
                      <span>متابعة اللاعب</span>
                    </>
                  )}
                </button>
              </div>
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

            {(profile.is_email_public || isCurrentUser) && profile.contact_email && (
              <a
                href={`mailto:${profile.contact_email}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#080808] border border-white/15 text-zinc-300 hover:text-white transition shadow-sm"
                title="البريد الإلكتروني المعتمد للتواصل"
              >
                <Mail className="w-4 h-4 text-zinc-400" />
                <span>{profile.contact_email}</span>
                {isCurrentUser && !profile.is_email_public && (
                  <span className="text-[10px] text-zinc-500 font-normal">(مخفي عن العامة)</span>
                )}
              </a>
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

      {isCurrentUser && (
        <ProfileStudioModal
          isOpen={isStudioOpen}
          onClose={() => setIsStudioOpen(false)}
          targetProfile={profile}
          onSaved={fetchProfileData}
        />
      )}
    </div>
  );
}