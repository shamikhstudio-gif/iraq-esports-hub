'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  PlusSquare,
} from 'lucide-react';
import { HomeIcon, TeamsIcon, MessagesIcon, SwordsIcon, BellIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { CreatePostModal } from './CreatePostModal';

interface NavItem {
  name: string;
  href?: string;
  icon: any;
  action?: () => void;
  badge?: number;
}

function MobileBottomNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type');

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedUserId) {
      setCurrentUser(null);
      setUnreadCount(0);
      return;
    }

    try {
      const [profileRes, notifRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', savedUserId).single(),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', savedUserId).eq('is_read', false),
      ]);

      if (profileRes.data) setCurrentUser(profileRes.data as Profile);
      if (typeof notifRes.count === 'number') setUnreadCount(notifRes.count);
    } catch (err) {
      console.error('Error fetching mobile bottom nav data:', err);
    }
  };

  const navItems: NavItem[] = [
    { name: 'الرئيسية', href: '/', icon: HomeIcon },
    { name: 'الفرق', href: '/teams', icon: TeamsIcon },
    { name: 'نشر', action: () => setIsCreateModalOpen(true), icon: PlusSquare },
    { name: 'السكريمات', href: '/scrims', icon: SwordsIcon },
    { name: 'الرسائل', href: '/messages', icon: MessagesIcon },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-md border-t border-white/[0.08] md:hidden py-1 px-4">
        <div className="flex items-center justify-around h-12">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = item.href ? (item.href === '/' ? pathname === '/' && (!currentType || currentType === 'all') : pathname.startsWith(item.href)) : false;

            if (item.action) {
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className="flex items-center justify-center p-2 text-zinc-400 hover:text-white transition"
                  title={item.name}
                >
                  <Icon className="w-6 h-6" />
                </button>
              );
            }

            return (
              <Link
                key={index}
                href={item.href!}
                prefetch={true}
                title={item.name}
                className={`relative flex items-center justify-center p-2 transition ${
                  isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Icon className="w-6 h-6" />
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#ed4956] text-white text-[9px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={() => {
          setIsCreateModalOpen(false);
          if (typeof window !== 'undefined' && pathname === '/') {
            window.location.reload();
          }
        }}
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