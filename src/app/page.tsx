'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from '@/lib/navigation';
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
import { SponsorVaultWidget } from '@/components/store/SponsorVaultWidget';
import { LiveMatchTicker } from '@/components/scrims/LiveMatchTicker';
import { Post } from '@/lib/types';
import { fetchPosts } from '@/lib/queries/posts';
import { AUTH_USER_KEY } from '@/lib/constants';
import { useSwrData } from '@/lib/cache';
import { PostSkeleton, Button, Badge, Card } from '@/components/ui';
import { AvatarWithDecoration } from '@/components/ui/AvatarWithDecoration';
import { PullToRefresh } from '@/components/feed/PullToRefresh';
import { useUser } from '@/context/UserContext';

const PAGE_SIZE = 10;

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type') || 'all';

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string>('all');

  const { user, refreshUser } = useUser();

  const observerRef = useRef<HTMLDivElement | null>(null);
  const postsContainerRef = useRef<HTMLDivElement | null>(null);

  // Cached initial posts feed with SWR (0ms instant render on revisit)
  const {
    data: posts = [],
    isLoading,
    mutate,
  } = useSwrData<Post[]>(
    `feed_posts_${selectedGame}_${currentType}`,
    async () => {
      const currentUserId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
      const data = await fetchPosts({
        game: selectedGame,
        postType: currentType,
        limit: PAGE_SIZE,
        offset: 0,
        currentUserId,
      });
      setHasMore(data.length === PAGE_SIZE);
      return data;
    },
    { ttl: 120_000 }
  );

  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading) return;
    setIsLoadingMore(true);
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
    const data = await fetchPosts({
      game: selectedGame,
      postType: currentType,
      limit: PAGE_SIZE,
      offset: posts.length,
      currentUserId,
    });
    if (data.length > 0) {
      mutate((prev) => [...(prev || []), ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } else {
      setHasMore(false);
    }
    setIsLoadingMore(false);
  }, [posts.length, isLoadingMore, hasMore, isLoading, selectedGame, currentType, mutate]);

  const handlePostCreated = (newPost: Post) => {
    mutate((prev) => [newPost, ...(prev || [])]);
  };

  const handlePostDeleted = useCallback((postId: string) => {
    mutate((prev) => (prev || []).filter((p) => p.id !== postId));
  }, [mutate]);

  const handlePostUpdated = useCallback((updatedPost: Partial<Post> & { id: string }) => {
    mutate((prev) => (prev || []).map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p)));
  }, [mutate]);

  const handleRefreshFeed = useCallback(async () => {
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
    const freshData = await fetchPosts({
      game: selectedGame,
      postType: currentType,
      limit: PAGE_SIZE,
      offset: 0,
      currentUserId,
    });
    mutate(freshData);
    setHasMore(freshData.length === PAGE_SIZE);

    await refreshUser();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ieh:refresh-feed'));
    }
  }, [selectedGame, currentType, mutate, refreshUser]);

  // Infinite scroll observer at footer of posts list
  useEffect(() => {
    const target = observerRef.current;
    if (!target || !hasMore || isLoading || isLoadingMore) return;

    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
    const scrollRoot = isDesktop ? postsContainerRef.current : null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { 
        root: scrollRoot,
        threshold: 0.1, 
        rootMargin: '250px' 
      }
    );

    observer.observe(target);
    return () => {
      observer.disconnect();
    };
  }, [loadMorePosts, hasMore, isLoading, isLoadingMore]);


  const handleTypeSelect = (type: string) => {
    if (type === 'all') {
      router.push('/');
    } else {
      router.push(`/?type=${type}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:h-full lg:min-h-0">
      <div 
        ref={postsContainerRef}
        className="lg:col-span-8 space-y-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain no-scrollbar pb-6"
      >
        <PullToRefresh
          onRefresh={handleRefreshFeed}
          scrollContainerRef={postsContainerRef}
          className="space-y-4"
        >
          {/* Live Scrim Matches Ticker */}
          <LiveMatchTicker onSelectLobby={() => router.push('/scrims')} />

        {/* Daily Check-in & eBits */}
        <DailyCheckinWidget />

        {/* Quick Post Box */}
        <Card variant="glass" className="p-3.5 sm:p-4 flex items-center gap-3">
          <AvatarWithDecoration
            src={user?.avatar_url || ''}
            alt={user?.full_name || 'User avatar'}
            size="sm"
            frame={user?.equipped_frame || (user?.has_neon_frame ? 'neon_pulse' : 'none')}
          />
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 ig-input text-right text-xs text-zinc-500 hover:text-zinc-300 transition py-2 cursor-pointer"
          >
            شارك منشوراً، اطلب سكريم، أو انشر إعلاناً...
          </button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span className="hidden sm:inline">نشر</span>
          </Button>
        </Card>

        {/* Feed Filter Bar */}
        <div className="flex items-center justify-between px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">المنشورات</span>
            {(selectedGame !== 'all' || currentType !== 'all') && (
              <Badge variant="solid" size="xs">
                <span>{selectedGame !== 'all' ? selectedGame : ''} {currentType !== 'all' ? `(${currentType})` : ''}</span>
              </Badge>
            )}
          </div>
        </div>

        {/* Posts List */}
        {isLoading && posts.length === 0 ? (
          <div className="space-y-4">
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <Card variant="glass" className="p-12 text-center text-zinc-500">
            <SwordsIcon className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
            <h3 className="font-medium text-sm text-zinc-300">لا توجد منشورات</h3>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onDelete={handlePostDeleted}
                onPostUpdated={handlePostUpdated}
              />
            ))}

            {/* Bottom Sentinel for Infinite Scroll */}
            <div ref={observerRef} className="h-4" />

            {/* Loading More Spinner */}
            {isLoadingMore && (
              <Card variant="glass" className="p-4 flex items-center justify-center gap-2 text-zinc-400 text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>جاري تحميل المزيد...</span>
              </Card>
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
        </PullToRefresh>
      </div>

      <div className="lg:col-span-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain no-scrollbar space-y-4 pb-6">
        {/* eSponsor Vault Widget */}
        <SponsorVaultWidget />

        <Sidebar
          activeGame={selectedGame}
          onSelectGame={setSelectedGame}
          activeType={currentType}
          onSelectType={handleTypeSelect}
          onCreatePostClick={() => setIsCreateModalOpen(true)}
        />
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
    <Suspense fallback={<Card variant="glass" className="p-12 text-center text-xs text-zinc-500">جاري التحميل...</Card>}>
      <HomeContent />
    </Suspense>
  );
}