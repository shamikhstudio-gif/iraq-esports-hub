'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plus, 
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { SwordsIcon } from '@/components/icons/CustomIcons';
import { Sidebar } from '@/components/Sidebar';
import { PostCard } from '@/components/PostCard';
import { CreatePostModal } from '@/components/CreatePostModal';
import { DailyCheckinWidget } from '@/components/DailyCheckinWidget';
import { supabase } from '@/lib/supabase';
import { Post } from '@/lib/types';

const PAGE_SIZE = 5;

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type') || 'all';

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>('all');

  const observerRef = useRef<HTMLDivElement | null>(null);

  // Initial fetch when filters change
  useEffect(() => {
    fetchInitialPosts(selectedGame, currentType);
  }, [currentType, selectedGame]);

  const fetchInitialPosts = async (game = selectedGame, type = currentType) => {
    setIsLoading(true);
    setHasMore(true);

    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(*)
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1);

    if (game !== 'all') {
      query = query.eq('game', game);
    }

    if (type !== 'all') {
      query = query.eq('post_type', type);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
      const postIds = data.map((p: any) => p.id);
      const likedPostIds = new Set<string>();

      if (savedUserId && postIds.length > 0) {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', savedUserId)
          .in('post_id', postIds);
        if (likesData) {
          likesData.forEach((l: any) => likedPostIds.add(l.post_id));
        }
      }

      const enrichedPosts = (data as Post[]).map((p) => ({
        ...p,
        is_liked: likedPostIds.has(p.id),
      }));

      setPosts(enrichedPosts);
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } else {
      setPosts([]);
      setHasMore(false);
    }
    setIsLoading(false);
  };

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading) return;
    setIsLoadingMore(true);

    const from = posts.length;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(*)
      `)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (selectedGame !== 'all') {
      query = query.eq('game', selectedGame);
    }

    if (currentType !== 'all') {
      query = query.eq('post_type', currentType);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
      const postIds = data.map((p: any) => p.id);
      const likedPostIds = new Set<string>();

      if (savedUserId && postIds.length > 0) {
        const { data: likesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', savedUserId)
          .in('post_id', postIds);
        if (likesData) {
          likesData.forEach((l: any) => likedPostIds.add(l.post_id));
        }
      }

      const enrichedPosts = (data as Post[]).map((p) => ({
        ...p,
        is_liked: likedPostIds.has(p.id),
      }));

      setPosts((prev) => [...prev, ...enrichedPosts]);
      if (data.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } else {
      setHasMore(false);
    }
    setIsLoadingMore(false);
  }, [posts.length, isLoadingMore, hasMore, isLoading, selectedGame, currentType]);

  // Infinite scroll observer at footer of posts list
  useEffect(() => {
    const target = observerRef.current;
    if (!target || !hasMore || isLoading || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 0.1, rootMargin: '250px' }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [loadMorePosts, hasMore, isLoading, isLoadingMore]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleTypeSelect = (type: string) => {
    if (type === 'all') {
      router.push('/');
    } else {
      router.push(`/?type=${type}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8 space-y-4">
        {/* Daily Check-in & XP */}
        <DailyCheckinWidget />

        {/* Quick Post Box */}
        <div className="ig-card p-3.5 sm:p-4 flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            alt="User avatar"
            className="w-9 h-9 rounded-full object-cover border border-white/10"
          />
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 ig-input text-right text-xs text-zinc-500 hover:text-zinc-300 transition py-2"
          >
            شارك منشوراً، اطلب سكريم، أو انشر إعلاناً...
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 ig-btn-primary rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">نشر</span>
          </button>
        </div>

        {/* Feed Filter Bar */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">المنشورات</span>
            {(selectedGame !== 'all' || currentType !== 'all') && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#0095f6] text-white font-medium text-[11px]">
                {selectedGame !== 'all' ? selectedGame : ''} {currentType !== 'all' ? `(${currentType})` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Posts List */}
        {isLoading && posts.length === 0 ? (
          <div className="ig-card p-12 text-center text-zinc-500 text-xs font-medium">
            جاري تحميل المنشورات...
          </div>
        ) : posts.length === 0 ? (
          <div className="ig-card p-12 text-center text-zinc-500">
            <SwordsIcon className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
            <h3 className="font-medium text-sm text-zinc-300">لا توجد منشورات</h3>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Bottom Sentinel for Infinite Scroll */}
            <div ref={observerRef} className="h-4" />

            {/* Loading More Spinner */}
            {isLoadingMore && (
              <div className="ig-card p-4 flex items-center justify-center gap-2 text-zinc-400 text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>جاري تحميل المزيد...</span>
              </div>
            )}

            {/* End of Posts Indicator */}
            {!hasMore && posts.length > 0 && (
              <div className="py-6 text-center text-zinc-600 text-xs font-medium flex items-center justify-center gap-2">
                <div className="h-[1px] w-8 bg-zinc-800" />
                <span>وصلت إلى نهاية المنشورات</span>
                <div className="h-[1px] w-8 bg-zinc-800" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lg:col-span-4">
        <div className="sticky top-20">
          <Sidebar
            activeGame={selectedGame}
            onSelectGame={setSelectedGame}
            activeType={currentType}
            onSelectType={handleTypeSelect}
            onCreatePostClick={() => setIsCreateModalOpen(true)}
          />
        </div>
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="ig-card p-12 text-center text-xs text-zinc-500">جاري التحميل...</div>}>
      <HomeContent />
    </Suspense>
  );
}