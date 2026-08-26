'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  Share2, 
  CheckCircle, 
  Megaphone, 
  Send,
  Gamepad2,
  Sparkles,
  MessageCircle,
  MoreHorizontal,
  X
} from 'lucide-react';
import { SwordsIcon, TeamsIcon, MessagesIcon } from '@/components/icons/CustomIcons';
import { Post, Comment } from '@/lib/types';
import { supabase } from '@/lib/supabase';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUserId(localStorage.getItem('babylon_user_id'));
    }
  }, []);

  useEffect(() => {
    setIsLiked(post.is_liked || false);
    setLikesCount(post.likes_count || 0);
  }, [post.id, post.is_liked, post.likes_count]);

  const handleLikeToggle = async () => {
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedUserId) {
      alert('يرجى تسجيل الدخول للتفاعل مع المنشور');
      return;
    }
    const userId = savedUserId;

    if (isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', userId);
      await supabase.from('posts').update({ likes_count: Math.max(0, likesCount - 1) }).eq('id', post.id);
    } else {
      setIsLiked(true);
      setLikesCount((prev) => prev + 1);
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: userId });
      await supabase.from('posts').update({ likes_count: likesCount + 1 }).eq('id', post.id);
    }
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select(`
        *,
        author:profiles!comments_author_id_fkey(*)
      `)
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data as Comment[]);
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedUserId) {
      alert('يرجى تسجيل الدخول للتعليق');
      return;
    }
    const userId = savedUserId;

    setIsSubmittingComment(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          author_id: userId,
          content: newComment.trim(),
        })
        .select(`
          *,
          author:profiles!comments_author_id_fkey(*)
        `)
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
      navigator.clipboard.writeText(`${window.location.origin}/#post-${post.id}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const renderTypeBadge = () => {
    switch (post.post_type) {
      case 'scrim':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-white/10 text-white">
            <SwordsIcon className="w-3 h-3" />
            سكريم
          </span>
        );
      case 'recruitment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#0095f6]/15 text-[#0095f6]">
            <TeamsIcon className="w-3 h-3" />
            طلب لاعبين
          </span>
        );
      case 'announcement':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400">
            <Megaphone className="w-3 h-3" />
            إعلان
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <article
      id={`post-${post.id}`}
      className="ig-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3.5 pb-2.5">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.author?.username || 'player'}`} className="shrink-0">
            <img
              src={post.author?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={post.author?.full_name || 'الناشر'}
              className="w-8 h-8 rounded-full object-cover border border-white/10"
            />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <Link 
                href={`/profile/${post.author?.username || 'player'}`}
                className="font-semibold text-xs text-white hover:underline transition flex items-center gap-1"
              >
                <span>{post.author?.full_name || 'شبكة IEH'}</span>
                {post.author?.role === 'admin' && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/10 text-white">
                    إدارة
                  </span>
                )}
              </Link>
              {post.author?.is_verified && (
                <CheckCircle className="w-3 h-3 text-[#0095f6] shrink-0" />
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <span>@{post.author?.username || 'ieh_admin'}</span>
              <span>•</span>
              <span className="font-mono">
                {new Date(post.created_at).toLocaleDateString('ar-IQ', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {renderTypeBadge()}
          {post.game && post.game !== 'عام' && post.game !== 'All Games' && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 bg-white/[0.04]">
              <Gamepad2 className="w-2.5 h-2.5" />
              {post.game}
            </span>
          )}
          {post.author_id === currentUserId && onDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className="p-1 text-zinc-500 hover:text-[#ed4956] transition"
              title="حذف المنشور"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Media Image if available */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="w-full max-h-[460px] overflow-hidden bg-black flex items-center justify-center">
          <img
            src={post.media_urls[0]}
            alt="مرفق المنشور"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Action Bar */}
      <div className="px-3.5 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLikeToggle}
            className="transition hover:opacity-70 active:scale-125"
            title="إعجاب"
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#ed4956] text-[#ed4956]' : 'text-white'}`} />
          </button>

          <button
            onClick={toggleComments}
            className="transition hover:opacity-70 text-white"
            title="تعليق"
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          <button
            onClick={handleShare}
            className="transition hover:opacity-70 text-white"
            title="مشاركة"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {copiedLink && (
            <span className="text-[10px] text-zinc-400">تم نسخ الرابط!</span>
          )}
        </div>

        {post.post_type === 'scrim' && (
          <Link
            href={`/profile/${post.author?.username || 'player'}`}
            className="px-3 py-1 ig-btn-primary rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <SwordsIcon className="w-3 h-3" />
            <span>تنسيق روم</span>
          </Link>
        )}
      </div>

      {/* Likes Count */}
      {likesCount > 0 && (
        <div className="px-3.5 pt-2 text-xs font-bold text-white">
          {likesCount} {likesCount === 1 ? 'إعجاب' : 'إعجاباً'}
        </div>
      )}

      {/* Content / Caption */}
      <div className="px-3.5 py-2 text-xs text-zinc-200 leading-relaxed whitespace-pre-line">
        <span className="font-bold text-white ml-1.5">
          {post.author?.username || 'player'}
        </span>
        {post.content}
      </div>

      {/* View Comments Toggle */}
      {(post.comments_count || comments.length) > 0 && (
        <button
          onClick={toggleComments}
          className="px-3.5 pb-2 text-xs text-zinc-500 hover:text-zinc-400 block text-right"
        >
          عرض جميع التعليقات ({comments.length || post.comments_count})
        </button>
      )}

      {/* Expanded Comments Section */}
      {showComments && (
        <div className="px-3.5 pb-3 pt-1 border-t border-white/[0.06] space-y-2">
          {comments.length === 0 ? (
            <div className="text-center py-2 text-xs text-zinc-500">
              لا توجد تعليقات بعد.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2 text-xs">
                  <img
                    src={comment.author?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={comment.author?.full_name || 'معلق'}
                    className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-white ml-1">
                      {comment.author?.username || comment.author?.full_name || 'لاعب'}
                    </span>
                    <span className="text-zinc-300">{comment.content}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Inline Comment Box */}
      <form onSubmit={handleAddComment} className="flex items-center px-3.5 py-2.5 border-t border-white/[0.06]">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="أضف تعليقاً..."
          className="flex-1 bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSubmittingComment || !newComment.trim()}
          className="text-xs font-semibold text-[#0095f6] hover:text-[#1aa1f7] disabled:opacity-30 mr-2 transition"
        >
          نشر
        </button>
      </form>
    </article>
  );
}