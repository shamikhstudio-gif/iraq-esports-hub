'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
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
  MoreHorizontal,
  Send,
  Edit2,
  Trash2,
  CornerDownLeft,
  Check
} from 'lucide-react';
import { SwordsIcon, TeamsIcon } from '@/components/icons/CustomIcons';
import { Post, Comment, resolveUserAvatar } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { AUTH_USER_KEY, GAMES_LIST, POST_TYPES } from '@/lib/constants';
import { useUser } from '@/context/UserContext';
import { Button, Badge, Card } from '@/components/ui';
import { AvatarWithDecoration } from '@/components/ui/AvatarWithDecoration';
import { triggerHaptic } from '@/lib/haptics';
import { deletePost, updatePost } from '@/lib/queries/posts';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
  onPostUpdated?: (updatedPost: Partial<Post> & { id: string }) => void;
  initialShowComments?: boolean;
  isDetailPage?: boolean;
}

const LIKE_PARTICLES = [
  { x: '16px', y: '0px' },
  { x: '11px', y: '-11px' },
  { x: '0px', y: '-16px' },
  { x: '-11px', y: '-11px' },
  { x: '-16px', y: '0px' },
  { x: '-11px', y: '11px' },
  { x: '0px', y: '16px' },
  { x: '11px', y: '11px' },
];

function PostCardComponent({ 
  post, 
  onDelete, 
  onPostUpdated,
  initialShowComments = false,
  isDetailPage: propIsDetailPage,
}: PostCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isDetailPage = propIsDetailPage ?? (pathname === `/post/${post.id}` || pathname === `/posts/${post.id}`);
  const { user: currentUser } = useUser();

  // Post states
  const [currentPost, setCurrentPost] = useState<Post>(post);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [isBursting, setIsBursting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [authError, setAuthError] = useState('');

  // Edit / Delete states
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editGame, setEditGame] = useState(post.game || 'عام');
  const [editPostType, setEditPostType] = useState<Post['post_type']>(post.post_type || 'general');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Comments states
  const [showComments, setShowComments] = useState(initialShowComments);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  const currentUserId = currentUser?.id || (typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null);
  const canManage = Boolean(currentUserId && (currentUserId === currentPost.author_id || currentUser?.role === 'admin'));

  // Sync prop changes
  useEffect(() => {
    setCurrentPost(post);
    setLikesCount(post.likes_count || 0);
    setIsLiked(post.is_liked || false);
    setEditContent(post.content);
    setEditGame(post.game || 'عام');
    setEditPostType(post.post_type || 'general');
  }, [post]);

  useEffect(() => {
    if (initialShowComments) {
      setShowComments(true);
      fetchComments();
    }
  }, [initialShowComments, post.id]);

  // Close menu on click outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const requireAuth = (action: string): string | null => {
    if (!currentUserId) {
      setAuthError(action === 'like' ? 'سجّل دخولك للتفاعل مع المنشور' : 'سجّل دخولك للتعليق');
      setTimeout(() => setAuthError(''), 3000);
      return null;
    }
    return currentUserId;
  };

  // --- Like Post ---
  const handleLikeToggle = async () => {
    const uid = requireAuth('like');
    if (!uid) return;

    triggerHaptic('light');

    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
      await supabase.from('post_likes').delete().eq('post_id', currentPost.id).eq('user_id', uid);
      await supabase.from('posts').update({ likes_count: Math.max(0, likesCount - 1) }).eq('id', currentPost.id);
    } else {
      setIsLiked(true);
      setIsBursting(true);
      setTimeout(() => setIsBursting(false), 550);
      setLikesCount((prev) => prev + 1);
      await supabase.from('post_likes').insert({ post_id: currentPost.id, user_id: uid });
      await supabase.from('posts').update({ likes_count: likesCount + 1 }).eq('id', currentPost.id);
    }
  };

  // --- Fetch Comments with replies and likes ---
  const fetchComments = async () => {
    try {
      const { data: rawComments, error } = await supabase
        .from('comments')
        .select(`*, author:profiles!comments_author_id_fkey(*)`)
        .eq('post_id', currentPost.id)
        .order('created_at', { ascending: true });

      if (error || !rawComments) return;

      const allComments = rawComments as Comment[];
      const commentIds = allComments.map((c) => c.id);

      // Fetch caller's comment likes
      if (currentUserId && commentIds.length > 0) {
        const { data: userLikes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', currentUserId)
          .in('comment_id', commentIds);

        if (userLikes) {
          setLikedCommentIds(new Set(userLikes.map((l: any) => l.comment_id)));
        }
      }

      // Structure tree: top-level comments and nested replies
      const topLevel: Comment[] = [];
      const repliesMap: Record<string, Comment[]> = {};

      for (const c of allComments) {
        if (c.parent_id) {
          if (!repliesMap[c.parent_id]) repliesMap[c.parent_id] = [];
          repliesMap[c.parent_id].push(c);
        } else {
          topLevel.push(c);
        }
      }

      const structured = topLevel.map((parent) => ({
        ...parent,
        replies: repliesMap[parent.id] || [],
      }));

      setComments(structured);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(!showComments);
  };

  // --- Add Comment or Reply ---
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const uid = requireAuth('comment');
    if (!uid) return;

    setIsSubmittingComment(true);
    try {
      const payload: any = {
        post_id: currentPost.id,
        author_id: uid,
        content: newComment.trim(),
        likes_count: 0,
      };

      if (replyingTo) {
        payload.parent_id = replyingTo.id;
      }

      const { data, error } = await supabase
        .from('comments')
        .insert(payload)
        .select(`*, author:profiles!comments_author_id_fkey(*)`)
        .single();

      if (error) throw error;
      if (data) {
        const addedComment = data as Comment;

        if (replyingTo) {
          // Append reply to specific parent
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyingTo.id
                ? { ...c, replies: [...(c.replies || []), addedComment] }
                : c
            )
          );
        } else {
          // Add as top-level comment
          setComments((prev) => [...prev, { ...addedComment, replies: [] }]);
        }

        setNewComment('');
        setReplyingTo(null);

        // Update post comments count
        const newCount = (currentPost.comments_count || 0) + 1;
        setCurrentPost((prev) => ({ ...prev, comments_count: newCount }));
        await supabase
          .from('posts')
          .update({ comments_count: newCount })
          .eq('id', currentPost.id);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // --- Toggle Comment Like ---
  const handleToggleCommentLike = async (commentId: string, currentCount = 0) => {
    const uid = requireAuth('like');
    if (!uid) return;

    triggerHaptic('light');
    const isCurrentlyLiked = likedCommentIds.has(commentId);

    // Optimistic UI updates
    const nextLiked = new Set(likedCommentIds);
    let delta = 1;
    if (isCurrentlyLiked) {
      nextLiked.delete(commentId);
      delta = -1;
    } else {
      nextLiked.add(commentId);
    }
    setLikedCommentIds(nextLiked);

    const updateCountInTree = (list: Comment[]): Comment[] =>
      list.map((item) => {
        if (item.id === commentId) {
          return { ...item, likes_count: Math.max(0, (item.likes_count || 0) + delta) };
        }
        if (item.replies && item.replies.length > 0) {
          return { ...item, replies: updateCountInTree(item.replies) };
        }
        return item;
      });

    setComments((prev) => updateCountInTree(prev));

    try {
      if (isCurrentlyLiked) {
        await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', uid);
        await supabase
          .from('comments')
          .update({ likes_count: Math.max(0, currentCount - 1) })
          .eq('id', commentId);
      } else {
        await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: uid });
        await supabase
          .from('comments')
          .update({ likes_count: currentCount + 1 })
          .eq('id', commentId);
      }
    } catch (err) {
      console.error('Failed to toggle comment like:', err);
    }
  };

  const handleStartReply = (targetComment: Comment) => {
    const authorName = targetComment.author?.username || targetComment.author?.full_name || 'لاعب';
    setReplyingTo({ id: targetComment.id, authorName });
    if (!showComments) setShowComments(true);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 50);
  };

  // --- Share Post ---
  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(`${window.location.origin}/post/${currentPost.id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // --- Edit Post Save ---
  const handleSaveEdit = async () => {
    if (!editContent.trim() || isSavingEdit) return;
    const uid = currentUserId;
    if (!uid) return;

    setIsSavingEdit(true);
    try {
      const updates = {
        content: editContent.trim(),
        game: editGame,
        post_type: editPostType,
      };

      const res = await updatePost(currentPost.id, uid, updates, currentUser?.role === 'admin');
      if (res.success) {
        const updated = {
          ...currentPost,
          content: editContent.trim(),
          game: editGame,
          post_type: editPostType,
        };
        setCurrentPost(updated);
        onPostUpdated?.(updated);
        setIsEditing(false);
      } else {
        alert(res.error || 'حدث خطأ أثناء تعديل المنشور');
      }
    } catch (err) {
      console.error('Failed to update post:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // --- Delete Post ---
  const handleDeletePost = async () => {
    const uid = currentUserId;
    if (!uid || isDeleting) return;

    setIsDeleting(true);
    try {
      const success = await deletePost(currentPost.id, uid, currentUser?.role === 'admin');
      if (success) {
        setShowDeleteConfirm(false);
        if (onDelete) {
          onDelete(currentPost.id);
        }
        if (isDetailPage) {
          router.push('/');
        }
      } else {
        alert('تعذر حذف المنشور، يرجى المحاولة لاحقاً');
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDetailPage || isEditing) return;

    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('select') ||
      target.closest('[role="button"]')
    ) {
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      return;
    }

    router.push(`/post/${currentPost.id}`);
  };

  const renderTypeBadge = () => {
    switch (currentPost.post_type) {
      case 'scrim':
        return (
          <Badge variant="outline" size="xs" icon={<SwordsIcon className="w-3 h-3 text-white" />}>
            <span>طلب سكريم</span>
          </Badge>
        );
      case 'recruitment':
        return (
          <Badge variant="outline" size="xs" icon={<TeamsIcon className="w-3 h-3 text-white" />}>
            <span>تجنيد لاعبين</span>
          </Badge>
        );
      case 'announcement':
        return (
          <Badge variant="solid" size="xs" icon={<Megaphone className="w-3 h-3" />}>
            <span>إعلان رسمي</span>
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      id={`post-${currentPost.id}`}
      variant="glass"
      onClick={handleCardClick}
      className={`feed-card-contain mb-4 overflow-hidden relative group transition-all duration-150 ${
        !isDetailPage && !isEditing ? 'cursor-pointer hover:border-white/25 hover:bg-white/[0.02]' : ''
      }`}
    >
      {/* Top Boosted / Ultra HD Badges */}
      {(currentPost.is_boosted || currentPost.is_ultra_hd) && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          {currentPost.is_boosted && (
            <Badge variant="outline" size="xs" icon={<Zap className="w-3 h-3 text-white" />}>
              <span>مُميَّز</span>
            </Badge>
          )}
          {currentPost.is_ultra_hd && (
            <Badge variant="solid" size="xs" icon={<Star className="w-3 h-3 fill-black text-black" />}>
              <span>4K Ultra</span>
            </Badge>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2.5">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${currentPost.author?.username || 'player'}`} className="shrink-0 group-hover:opacity-90 transition-opacity">
            <AvatarWithDecoration
              src={resolveUserAvatar(currentPost.author)}
              alt={currentPost.author?.full_name || 'الناشر'}
              frame={currentPost.author?.equipped_frame || (currentPost.author?.has_neon_frame ? 'neon_pulse' : 'none')}
              size="sm"
            />
          </Link>
          <div className="flex flex-col -mt-0.5">
            <div className="flex items-center gap-1.5">
              <Link
                href={`/profile/${currentPost.author?.username || 'player'}`}
                className="font-bold text-[14px] text-white hover:text-zinc-300 transition-colors flex items-center gap-1.5 tracking-tight"
              >
                <span>{currentPost.author?.full_name || 'شبكة IEH'}</span>
                {currentPost.author?.is_verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-white shrink-0 fill-white/20" />
                )}
                {currentPost.author?.role === 'admin' && (
                  <Badge variant="solid" size="xs" className="ml-1 uppercase">
                    Admin
                  </Badge>
                )}
              </Link>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-zinc-500 font-medium mt-0.5">
              <span>@{currentPost.author?.username || 'ieh_player'}</span>
              <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
              <Link
                href={`/post/${currentPost.id}`}
                className="text-zinc-400 hover:text-white font-mono tracking-tighter transition-colors"
                title="فتح صفحة المنشور"
              >
                {new Date(currentPost.created_at).toLocaleDateString('ar-IQ', { month: 'short', day: 'numeric' })}
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          {renderTypeBadge()}
          {currentPost.game && currentPost.game !== 'عام' && currentPost.game !== 'All Games' && (
            <Badge variant="default" size="xs" icon={<Gamepad2 className="w-3 h-3" />}>
              <span>{currentPost.game}</span>
            </Badge>
          )}

          {/* Manage Options Menu for Author or Admin */}
          {canManage && (
            <div className="relative" ref={menuRef}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="text-zinc-400 hover:text-white"
                title="خيارات المنشور"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>

              {showMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 top-full mt-1.5 w-36 bg-black border border-white/20 rounded-xl shadow-2xl p-1 z-30 animate-in fade-in zoom-in-95 duration-150"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setIsEditing(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal / Banner */}
      {showDeleteConfirm && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="mx-4 mb-3 p-3.5 rounded-xl bg-white/[0.05] border border-white/25 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2 text-xs text-white font-bold">
            <Trash2 className="w-4 h-4 shrink-0" />
            <span>هل أنت متأكد من رغبتك في حذف هذا المنشور نهائياً؟</span>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button
              variant="primary"
              size="xs"
              onClick={handleDeletePost}
              disabled={isDeleting}
            >
              {isDeleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
            </Button>
          </div>
        </div>
      )}

      {/* Caption or Edit Form */}
      {isEditing ? (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="px-4 pb-3 space-y-3"
        >
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full bg-black/60 border border-white/20 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition resize-none leading-relaxed"
            placeholder="محتوى المنشور..."
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
            <div className="flex items-center gap-2">
              <select
                value={editGame}
                onChange={(e) => setEditGame(e.target.value)}
                className="bg-black border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                {GAMES_LIST.map((g) => (
                  <option key={g.id} value={g.id} className="bg-black text-white">
                    {g.name}
                  </option>
                ))}
              </select>

              <select
                value={editPostType}
                onChange={(e) => setEditPostType(e.target.value as Post['post_type'])}
                className="bg-black border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
              >
                {POST_TYPES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-black text-white">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(currentPost.content);
                }}
                disabled={isSavingEdit}
              >
                إلغاء
              </Button>
              <Button
                variant="primary"
                size="xs"
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editContent.trim()}
                icon={<Check className="w-3.5 h-3.5" />}
              >
                {isSavingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 pb-3 text-[14px] text-zinc-200 leading-[1.6] whitespace-pre-line font-medium">
          {currentPost.content}
        </div>
      )}

      {/* Media with lazy & async decoding */}
      {currentPost.media_urls && currentPost.media_urls.length > 0 && (
        <div className="px-3 pb-3">
          <div className="w-full max-h-[500px] overflow-hidden rounded-xl border border-white/10 bg-black/50 relative shadow-inner">
            <img 
              src={currentPost.media_urls[0]} 
              alt="مرفق المنشور" 
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-105" 
            />
          </div>
        </div>
      )}

      {/* Inline auth error */}
      {authError && (
        <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-semibold shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {authError}
        </div>
      )}

      {/* Action Bar */}
      <div className="px-2 py-2 flex items-center justify-between border-t border-white/[0.04] bg-white/[0.01]">
        <div className="flex items-center gap-1">
          <button 
            type="button"
            onClick={handleLikeToggle} 
            className="group flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all cursor-pointer select-none text-zinc-400 hover:text-white" 
            title="إعجاب"
          >
            <div className="relative flex items-center justify-center p-1">
              {isBursting && (
                <>
                  <span className="absolute w-4 h-4 rounded-full border border-white pointer-events-none animate-heart-ring" />
                  {LIKE_PARTICLES.map((p, idx) => (
                    <span
                      key={idx}
                      style={{ '--tx': p.x, '--ty': p.y } as React.CSSProperties}
                      className="absolute w-1 h-1 rounded-full bg-white shadow-[0_0_6px_#ffffff] pointer-events-none animate-heart-particle"
                    />
                  ))}
                </>
              )}

              <Heart 
                fill={isLiked ? '#ffffff' : 'none'}
                color={isLiked ? '#ffffff' : 'currentColor'}
                className={`w-[19px] h-[19px] transition-all duration-200 ${
                  isBursting ? 'animate-heart-pop' : ''
                } ${
                  isLiked 
                    ? '!fill-white !text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]' 
                    : '!fill-none text-zinc-400 group-hover:text-white group-hover:scale-110'
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
            type="button"
            onClick={toggleComments} 
            className="group flex items-center gap-2 px-3 py-2 rounded-full transition-all text-zinc-400 hover:bg-white/[0.06] hover:text-white cursor-pointer" 
            title="التعليقات"
          >
            <div className="p-1.5 rounded-full transition-transform group-active:scale-75">
              <MessageCircle className="w-[18px] h-[18px] group-hover:scale-110 transition-all" />
            </div>
            {currentPost.comments_count > 0 && (
              <span className="text-xs font-bold font-mono pt-0.5">{currentPost.comments_count}</span>
            )}
          </button>

          <button 
            type="button"
            onClick={handleShare} 
            className="group relative flex items-center gap-2 px-3 py-2 rounded-full transition-all text-zinc-400 hover:bg-white/[0.06] hover:text-white cursor-pointer" 
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

        {currentPost.post_type === 'scrim' && (
          <Link href={`/profile/${currentPost.author?.username || 'player'}`} className="mr-2">
            <Button variant="primary" size="sm" icon={<SwordsIcon className="w-3.5 h-3.5" />}>
              <span>تنسيق روم</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Expanded Comments & Nested Replies */}
      {showComments && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="px-4 pb-4 pt-3 bg-black/40 border-t border-white/[0.06]"
        >
          {comments.length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-500 font-medium">كن أول من يعلق على هذا المنشور.</div>
          ) : (
            <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {comments.map((comment) => {
                const isCommentLiked = likedCommentIds.has(comment.id);
                const commentLikes = comment.likes_count || 0;

                return (
                  <div key={comment.id} className="space-y-2 group">
                    {/* Main Parent Comment */}
                    <div className="flex items-start gap-3">
                      <Link href={`/profile/${comment.author?.username || 'player'}`} className="shrink-0">
                        <img
                          src={resolveUserAvatar(comment.author)}
                          alt={comment.author?.full_name || 'معلق'}
                          loading="lazy"
                          decoding="async"
                          className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0 aspect-square"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tr-sm px-4 py-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/profile/${comment.author?.username || 'player'}`} className="font-bold text-[13px] text-white hover:underline truncate">
                              {comment.author?.username || comment.author?.full_name || 'لاعب'}
                            </Link>
                            {comment.author?.is_verified && <CheckCircle className="w-3 h-3 text-white fill-white/20 shrink-0" />}
                            <span className="text-[10px] text-zinc-500 font-mono ml-auto shrink-0">
                              {new Date(comment.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[13px] text-zinc-300 leading-relaxed break-words">{comment.content}</p>
                        </div>

                        {/* Comment Action Bar (Like & Reply) */}
                        <div className="flex items-center gap-4 mt-1 mr-2 text-[11px] font-bold text-zinc-400">
                          <button
                            type="button"
                            onClick={() => handleToggleCommentLike(comment.id, comment.likes_count)}
                            className={`flex items-center gap-1 hover:text-white transition cursor-pointer ${
                              isCommentLiked ? 'text-white font-black' : ''
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isCommentLiked ? 'fill-white text-white' : ''}`} />
                            <span>{commentLikes > 0 ? commentLikes : 'إعجاب'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStartReply(comment)}
                            className="flex items-center gap-1 hover:text-white transition cursor-pointer"
                          >
                            <CornerDownLeft className="w-3.5 h-3.5" />
                            <span>رد</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Nested Replies Section */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mr-8 border-r-2 border-white/10 pr-3 space-y-2.5 mt-2">
                        {comment.replies.map((reply) => {
                          const isReplyLiked = likedCommentIds.has(reply.id);
                          const replyLikes = reply.likes_count || 0;

                          return (
                            <div key={reply.id} className="flex items-start gap-2.5">
                              <Link href={`/profile/${reply.author?.username || 'player'}`} className="shrink-0">
                                <img
                                  src={resolveUserAvatar(reply.author)}
                                  alt={reply.author?.full_name || 'رد'}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0 aspect-square"
                                />
                              </Link>
                              <div className="flex-1 min-w-0">
                                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl rounded-tr-sm px-3.5 py-2">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <Link href={`/profile/${reply.author?.username || 'player'}`} className="font-bold text-[12px] text-white hover:underline truncate">
                                      {reply.author?.username || reply.author?.full_name || 'لاعب'}
                                    </Link>
                                    {reply.author?.is_verified && <CheckCircle className="w-2.5 h-2.5 text-white fill-white/20 shrink-0" />}
                                    <span className="text-[9px] text-zinc-500 font-mono ml-auto shrink-0">
                                      {new Date(reply.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-[12px] text-zinc-300 leading-relaxed break-words">{reply.content}</p>
                                </div>

                                {/* Reply Action Bar (Like & Secondary Reply) */}
                                <div className="flex items-center gap-3 mt-1 mr-2 text-[10px] font-bold text-zinc-400">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCommentLike(reply.id, reply.likes_count)}
                                    className={`flex items-center gap-1 hover:text-white transition cursor-pointer ${
                                      isReplyLiked ? 'text-white font-black' : ''
                                    }`}
                                  >
                                    <Heart className={`w-3 h-3 ${isReplyLiked ? 'fill-white text-white' : ''}`} />
                                    <span>{replyLikes > 0 ? replyLikes : 'إعجاب'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStartReply(comment)}
                                    className="flex items-center gap-1 hover:text-white transition cursor-pointer"
                                  >
                                    <CornerDownLeft className="w-3 h-3" />
                                    <span>رد</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Replying-to Banner Indicator */}
          {replyingTo && (
            <div className="mt-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-zinc-200">
              <span className="flex items-center gap-1.5 font-bold">
                <CornerDownLeft className="w-3.5 h-3.5 text-white" />
                <span>الرد على: @{replyingTo.authorName}</span>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-zinc-400 hover:text-white transition p-0.5 rounded-full hover:bg-white/10"
                title="إلغاء الرد"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Comment / Reply Input Form */}
          <form onSubmit={handleAddComment} className="mt-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-[#141416] shrink-0 shadow-sm">
              <img 
                src={resolveUserAvatar(currentUser)} 
                alt="My Avatar"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 relative">
              <input
                ref={commentInputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? `اكتب ردك على @${replyingTo.authorName}...` : 'أضف تعليقاً...'}
                className="w-full bg-black/50 border border-white/15 rounded-full pl-11 pr-4 py-2 text-[13px] text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center justify-center cursor-pointer"
                title="إرسال"
              >
                <Send className="w-4 h-4 -scale-x-100 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}

export const PostCard = memo(PostCardComponent);