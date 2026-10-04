'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from '@/lib/navigation';
import Link from '@/lib/navigation';
import { 
  ArrowRight, 
  Share2, 
  AlertCircle, 
  Home
} from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { PostSkeleton, Button, Badge, Card } from '@/components/ui';
import { fetchPostById, deletePost } from '@/lib/queries/posts';
import { Post } from '@/lib/types';
import { AUTH_USER_KEY } from '@/lib/constants';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!postId) return;

    let isMounted = true;
    async function loadPost() {
      setIsLoading(true);
      setError(null);
      try {
        const currentUserId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
        const fetched = await fetchPostById(postId, currentUserId);
        if (!isMounted) return;

        if (fetched) {
          setPost(fetched);
        } else {
          setError('المنشور المطلوب غير موجود أو قد تم حذفه.');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load post detail:', err);
        setError('تعذر تحميل المنشور، يرجى المحاولة مرة أخرى.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPost();

    return () => {
      isMounted = false;
    };
  }, [postId]);

  const handleDelete = async (id: string) => {
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
    if (!currentUserId) return;
    const ok = await deletePost(id, currentUserId);
    if (ok) {
      router.push('/');
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-4xl lg:max-w-5xl mx-auto space-y-4 py-2 animate-in fade-in duration-200">
      {/* Navigation Breadcrumb / Top Bar */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition group cursor-pointer"
        >
          <div className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 group-hover:bg-white/10 group-hover:border-white/20 transition">
            <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-white" />
          </div>
          <span className="font-bold">العودة إلى الخلاصة العامة</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={handleCopyLink}
            className="gap-1.5 font-bold"
          >
            <Share2 className="w-3 h-3" />
            <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة'}</span>
          </Button>
        </div>
      </div>

      {/* Post Container */}
      {isLoading ? (
        <div className="space-y-4">
          <PostSkeleton />
        </div>
      ) : error || !post ? (
        <Card variant="glass" className="p-10 sm:p-14 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
            <AlertCircle className="w-6 h-6 text-zinc-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-black text-white">المنشور غير متاح</h2>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              {error || 'ربما تم حذف هذا المنشور أو أن الرابط غير صحيح.'}
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/')}
              icon={<Home className="w-4 h-4" />}
              className="font-black"
            >
              <span>العودة للرئيسية</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Render full post card with comments open by default */}
          <PostCard 
            post={post} 
            onDelete={handleDelete}
            onPostUpdated={(updated) => setPost((prev) => (prev ? { ...prev, ...updated } : prev))}
            initialShowComments={true} 
            isDetailPage={true}
          />
        </div>
      )}
    </div>
  );
}
