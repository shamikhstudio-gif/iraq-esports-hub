'use client';

import React, { useState, useEffect } from 'react';
import Link, { useRouter, usePathname } from '@/lib/navigation';
import { 
  Heart, 
  Share2, 
  CheckCircle, 
  Megaphone, 
  Gamepad2,
  MessageCircle,
  X,
  Star,
  Zap,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import { SwordsIcon, TeamsIcon } from '@/components/icons/CustomIcons';
import { Post, Comment, resolveUserAvatar } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { AUTH_USER_KEY } from '@/lib/constants';
import { useUser } from '@/context/UserContext';
import { Button, Badge, Card } from '@/components/ui';
import { AvatarWithDecoration } from '@/components/ui/AvatarWithDecoration';
import { triggerHaptic } from '@/lib/haptics';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
  initialShowComments?: boolean;
  isDetailPage?: boolean;
}

const LIKE_PARTICLES = [
  { x: '18px', y: '0px' },
  { x: '13px', y: '-13px' },
  { x: '0px', y: '-18px' },
  { x: '-13px', y: '-13px' },
  { x: '-18px', y: '0px' },
  { x: '-13px', y: '13px' },
  { x: '0px', y: '18px' },
  { x: '13px', y: '13px' },
];

export function PostCard({ 
  post, 
  onDelete, 
  initialShowComments = false,
  isDetailPage: propIsDetailPage,
}: PostCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isDetailPage = propIsDetailPage ?? (pathname === `/post/${post.id}` || pathname === `/posts/${post.id}`);
  const { user: currentUser } = useUser();
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [isBursting, setIsBursting] = useState(false);
  const [showComments, setShowComments] = useState(initialShowComments);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUserId(localStorage.getItem(AUTH_USER_KEY));
    }
  }, []);

  useEffect(() => {
    if (initialShowComments) {
      setShowComments(true);
      fetchComments();
    }
  }, [initialShowComments, post.id]);

  useEffect(() => {
    setIsLiked(post.is_liked || false);
    setLikesCount(post.likes_count || 0);
  }, [post.id, post.is_liked, post.likes_count]);

  const requireAuth = (action: string): string | null => {
    const userId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
    if (!userId) {
      setAuthError(action === 'like' ? 'سجّل دخولك للتفاعل مع المنشور' : 'سجّل دخولك للتعليق');
      setTimeout(() => setAuthError(''), 3000);
      return null;
    }
    return userId;
  };

  const handleLikeToggle = async () => {
    const userId = requireAuth('like');
    if (!userId) return;

    triggerHaptic('light');

    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', userId);
      await supabase.from('posts').update({ likes_count: Math.max(0, likesCount - 1) }).eq('id', post.id);
    } else {
      setIsLiked(true);
      setIsBursting(true);
      setTimeout(() => setIsBursting(false), 550);
      setLikesCount((prev) => prev + 1);
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: userId });
      await supabase.from('posts').update({ likes_count: likesCount + 1 }).eq('id', post.id);
    }
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select(`*, author:profiles!comments_author_id_fkey(*)`)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    if (data) setComments(data as Comment[]);
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const userId = requireAuth('comment');
    if (!userId) return;

    setIsSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: post.id, author_id: userId, content: newComment.trim() })
        .select(`*, author:profiles!comments_author_id_fkey(*)`)
        .single();

      if (error) throw error;
      if (data) {
        setComments((prev) => [...prev, data as Comment]);
        setNewComment('');
        await supabase
          .from('posts')
          .update({ comments_count: (post.comments_count || 0) + 1 })
          .eq('id', post.id);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const renderTypeBadge = () => {
    switch (post.post_type) {
      case 'scrim':
        return (
          <Badge variant="outline" size="xs" icon={<SwordsIcon className="w-3.5 h-3.5" />}>
            <span>سكريم</span>
          </Badge>
        );
      case 'recruitment':
        return (
          <Badge variant="default" size="xs" icon={<TeamsIcon className="w-3.5 h-3.5" />}>
            <span>طلب لاعبين</span>
          </Badge>
        );
      case 'announcement':
        return (
          <Badge variant="solid" size="xs" icon={<Megaphone className="w-3 h-3 text-black" />}>
            <span>إعلان</span>
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDetailPage) return;

    const target = e.target as HTMLElement;
    // Don't navigate if user clicked an interactive control (button, link, input, textarea)
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('[role="button"]')
    ) {
      return;
    }

    // Don't navigate if user is highlighting/selecting text
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return;
    }

    router.push(`/post/${post.id}`);
  };

  return (
    <Card
      id={`post-${post.id}`}
      variant="glass"
      onClick={handleCardClick}
      className={`mb-6 overflow-hidden relative group transition-colors duration-150 ${
        !isDetailPage ? 'cursor-pointer hover:border-white/25 hover:bg-white/[0.02]' : ''
      }`}
    >
      {/* Top Boosted / Ultra HD Badges */}
      {(post.is_boosted || post.is_ultra_hd) && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          {post.is_boosted && (
            <Badge variant="outline" size="xs" icon={<Zap className="w-3 h-3 text-white" />}>
              <span>مُميَّز</span>
            </Badge>
          )}
          {post.is_ultra_hd && (
            <Badge variant="solid" size="xs" icon={<Star className="w-3 h-3 fill-black text-black" />}>
              <span>4K Ultra</span>
            </Badge>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2.5">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author?.username || 'player'}`} className="shrink-0 group-hover:opacity-90 transition-opacity">
            <AvatarWithDecoration
              src={resolveUserAvatar(post.author)}
              alt={post.author?.full_name || 'الناشر'}
              frame={post.author?.equipped_frame || (post.author?.has_neon_frame ? 'neon_pulse' : 'none')}
              size="sm"
            />
          </Link>
          <div className="flex flex-col -mt-0.5">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/profile/${post.author?.username || 'player'}`}
                className="font-bold text-[14px] text-white hover:text-zinc-300 transition-colors flex items-center gap-1.5 tracking-tight"
              >
                <span>{post.author?.full_name || 'شبكة IEH'}</span>
                {post.author?.is_verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-white shrink-0 fill-white/20" />
                )}
                {post.author?.role === 'admin' && (
                  <Badge variant="solid" size="xs" className="ml-1 uppercase">
                    Admin
                  </Badge>
                )}
              </Link>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-zinc-500 font-medium mt-0.5">
              <span>@{post.author?.username || 'ieh_admin'}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
              <Link
                href={`/post/${post.id}`}
                className="text-zinc-400 hover:text-white font-mono tracking-tighter transition-colors"
                title="فتح صفحة المنشور"
              >
                {new Date(post.created_at).toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' })}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {renderTypeBadge()}
          {post.game && post.game !== 'عام' && post.game !== 'All Games' && (
            <Badge variant="default" size="xs" icon={<Gamepad2 className="w-3 h-3" />}>
              <span>{post.game}</span>
            </Badge>
          )}
          {post.author_id === currentUserId && onDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onDelete(post.id)}
              className="text-zinc-500 hover:text-white"
              title="حذف المنشور"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Caption (Moved above media for premium feel) */}
      <div className="px-4 pb-3 text-[14px] text-zinc-200 leading-[1.6] whitespace-pre-line font-medium">
        {post.content}
      </div>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="px-3 pb-3">
          <div className="w-full max-h-[500px] overflow-hidden rounded-xl border border-white/10 bg-black/50 relative shadow-inner">
            <img 
              src={post.media_urls[0]} 
              alt="مرفق المنشور" 
              className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-105" 
            />
          </div>
        </div>
      )}

      {/* Inline auth error */}
      {authError && (
        <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {authError}
        </div>
      )}

      {/* Action Bar */}
      <div className="px-2 py-2 flex items-center justify-between border-t border-white/[0.04] bg-white/[0.01]">
        <div className="flex items-center gap-1">
          <button 
            onClick={handleLikeToggle} 
            className="group flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all cursor-pointer select-none text-zinc-400 hover:text-white" 
            title="إعجاب"
          >
            <div className="relative flex items-center justify-center p-1">
              {/* Particle Burst Elements on Like */}
              {isBursting && (
                <>
                  {/* Expanding Ripple Ring */}
                  <span className="absolute w-4 h-4 rounded-full border border-white pointer-events-none animate-heart-ring" />
                  
                  {/* Micro Sparks / Particles */}
                  {LIKE_PARTICLES.map((p, idx) => (
                    <span
                      key={idx}
                      style={{ '--tx': p.x, '--ty': p.y } as React.CSSProperties}
                      className="absolute w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#ffffff] pointer-events-none animate-heart-particle"
                    />
                  ))}
                </>
              )}

              {/* Pure Heart Shape */}
              <Heart 
                className={`w-[19px] h-[19px] transition-all duration-200 ${
                  isBursting ? 'animate-heart-pop' : ''
                } ${
                  isLiked 
                    ? 'fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]' 
                    : 'fill-transparent text-zinc-400 group-hover:text-white group-hover:scale-110'
                }`} 
              />
            </div>

            {likesCount > 0 && (
              <span className={`text-xs font-bold font-mono pt-0.5 transition-colors ${
                isLiked ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
              }`}>
                {likesCount}
              </span>
            )}
          </button>

          <button 
            onClick={toggleComments} 
            className="group flex items-center gap-2 px-3 py-2 rounded-full transition-all text-zinc-400 hover:bg-white/[0.06] hover:text-white" 
            title="تعليق"
          >
            <div className="p-1.5 rounded-full transition-transform group-active:scale-75">
              <MessageCircle className="w-[18px] h-[18px] group-hover:scale-110 transition-all" />
            </div>
            {post.comments_count > 0 && <span className="text-xs font-bold font-mono pt-0.5">{post.comments_count}</span>}
          </button>

          <button 
            onClick={handleShare} 
            className="group relative flex items-center gap-2 px-3 py-2 rounded-full transition-all text-zinc-400 hover:bg-white/[0.06] hover:text-white" 
            title="مشاركة"
          >
            <div className="p-1.5 rounded-full transition-transform group-active:scale-75">
              <Share2 className="w-[18px] h-[18px] group-hover:scale-110 transition-all" />
            </div>
            {copiedLink && (
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-white text-black text-[10px] font-bold rounded shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                تم النسخ!
              </span>
            )}
          </button>
        </div>

        {post.post_type === 'scrim' && (
          <Link href={`/profile/${post.author?.username || 'player'}`} className="mr-2">
            <Button variant="primary" size="sm" icon={<SwordsIcon className="w-3.5 h-3.5" />}>
              <span>تنسيق روم</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Expanded Comments */}
      {showComments && (
        <div className="px-4 pb-4 pt-3 bg-black/20 border-t border-white/[0.02]">
          {comments.length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-500 font-medium">كن أول من يعلق على هذا المنشور.</div>
          ) : (
            <div className="space-y-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3 group">
                  <Link href={`/profile/${comment.author?.username || 'player'}`} className="shrink-0">
                    <img
                      src={resolveUserAvatar(comment.author)}
                      alt={comment.author?.full_name || 'معلق'}
                      className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0 aspect-square"
                    />
                  </Link>
                  <div className="flex-1 bg-white/[0.03] border border-white/[0.02] rounded-2xl rounded-tr-sm px-4 py-2.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link href={`/profile/${comment.author?.username || 'player'}`} className="font-bold text-[13px] text-white hover:underline">
                        {comment.author?.username || comment.author?.full_name || 'لاعب'}
                      </Link>
                      {comment.author?.is_verified && <CheckCircle className="w-3 h-3 text-white fill-white/20" />}
                      <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                        {new Date(comment.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[13px] text-zinc-300 leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment Input */}
          <form onSubmit={handleAddComment} className="mt-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-[#141416] shrink-0 shadow-sm">
              <img 
                src={resolveUserAvatar(currentUser)} 
                alt="My Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="أضف تعليقاً..."
                className="w-full bg-black/40 border border-white/10 rounded-full pl-4 pr-12 py-2.5 text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <svg className="w-5 h-5 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2z"/></svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}