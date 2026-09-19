'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from '@/lib/navigation';
import { usePathname, useSearchParams } from '@/lib/navigation';
import { PlusSquare } from 'lucide-react';
import { HomeIcon, TeamsIcon, MessagesIcon, SwordsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { CreatePostModal } from './CreatePostModal';
import { AUTH_USER_KEY } from '@/lib/constants';

import { Button, Badge } from '@/components/ui';

type NavItemConfig =
  | { name: string; href: string; icon: React.ElementType; badge?: number }
  | { name: string; action: () => void; icon: React.ElementType };

function MobileBottomNavContent() {
  const pathname = usePathname();
  useSearchParams(); // triggers Suspense boundary for searchParams

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchNotifCount();
  }, []);

  const fetchNotifCount = async () => {
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
    if (!savedUserId) return;

    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', savedUserId)
        .eq('is_read', false);
      if (typeof count === 'number') setUnreadCount(count);
    } catch (err) {
      console.error('MobileBottomNav notif fetch error:', err);
    }
  };

  const navItems: NavItemConfig[] = [
    { name: 'الرئيسية', href: '/', icon: HomeIcon },
    { name: 'الفرق', href: '/teams', icon: TeamsIcon },
    { name: 'نشر', action: () => setIsCreateModalOpen(true), icon: PlusSquare },
    { name: 'السكريمات', href: '/scrims', icon: SwordsIcon },
    { name: 'الرسائل', href: '/messages', icon: MessagesIcon, badge: unreadCount },
  ];

  // Hide bottom navigation completely when inside chat/messages screen so it does not overlay composer
  if (pathname.startsWith('/messages')) {
    return null;
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-white/[0.08] md:hidden py-1 px-4">
        <div className="flex items-center justify-around h-12">
          {navItems.map((item, index) => {
            const Icon = item.icon;

            // Action button (e.g. create post)
            if ('action' in item) {
              return (
                <Button
                  key={index}
                  variant="ghost"
                  size="icon-sm"
                  onClick={item.action}
                  className="text-zinc-400 hover:text-white"
                  title={item.name}
                >
                  <Icon className="w-6 h-6" />
                </Button>
              );
            }

            // Link button
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={index}
                href={item.href}
                prefetch={true}
                title={item.name}
                className={`relative flex items-center justify-center p-2 transition ${
                  isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="w-6 h-6" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute top-0.5 right-2 min-w-[15px] h-[15px] px-1 bg-white text-black font-black text-[9px] leading-none rounded-full flex items-center justify-center border border-black shadow-sm pointer-events-none select-none">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavContent />
    </Suspense>
  );
}