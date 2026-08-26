'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, 
  User, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Flame, 
  Search,
  PlusSquare, 
  Menu, 
  X
} from 'lucide-react';
import { HomeIcon, TeamsIcon, BellIcon, MessagesIcon, SwordsIcon, SettingsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { CreatePostModal } from './CreatePostModal';
import { CreateTeamModal } from './CreateTeamModal';

function NavbarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type');

  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState<boolean>(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState<boolean>(false);

  useEffect(() => {
    loadNavbarData();
  }, []);

  const loadNavbarData = async () => {
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedUserId) {
      setCurrentUser(null);
      setUnreadCount(0);
      return;
    }

    try {
      const [userRes, notifRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', savedUserId).single(),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', savedUserId)
          .eq('is_read', false),
      ]);

      if (userRes.data) {
        setCurrentUser(userRes.data);
      }
      if (typeof notifRes.count === 'number') {
        setUnreadCount(notifRes.count);
      }
    } catch (err) {
      console.error('Navbar data fetch error:', err);
    }
  };

  const handleSwitchAccount = async (targetEmail: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', targetEmail)
      .single();

    if (data) {
      setCurrentUser(data);
      if (typeof window !== 'undefined') {
        localStorage.setItem('babylon_user_id', data.id);
      }
      setIsUserMenuOpen(false);
      window.location.reload();
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('babylon_user_id');
    }
    setCurrentUser(null);
    window.location.reload();
  };

  const checkIsActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const navLinks = [
    { name: 'الرئيسية', href: '/', icon: HomeIcon },
    { name: 'الفرق', href: '/teams', icon: TeamsIcon },
    { name: 'السكريمات', href: '/scrims', icon: SwordsIcon },
    ...(currentUser?.role === 'admin' ? [{ name: 'الإدارة', href: '/admin', icon: ShieldCheck }] : []),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-[935px] mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            
            {/* Logo Wordmark */}
            <div className="flex items-center gap-4">
              <Link href="/" prefetch={true} className="flex items-center gap-2" title="الصفحة الرئيسية">
                <span className="text-xl font-black tracking-tight text-white hover:opacity-80 transition">IEH</span>
              </Link>

              <Link
                href="/teams"
                prefetch={true}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-xs transition border border-white/[0.05]"
                title="البحث عن الفرق واللاعبين"
              >
                <Search className="w-3.5 h-3.5" />
                <span>بحث...</span>
              </Link>
            </div>

            {/* Center Navigation Icons */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = checkIsActive(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    prefetch={true}
                    title={link.name}
                    className={`relative p-2 rounded-lg transition ${
                      isActive
                        ? 'text-white'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center gap-3">
              {currentUser && (
                <>
                  {/* Create Post Button */}
                  <button
                    onClick={() => setIsCreatePostOpen(true)}
                    className="p-1.5 text-zinc-400 hover:text-white transition"
                    title="إنشاء منشور جديد"
                  >
                    <PlusSquare className="w-5 h-5" />
                  </button>

                  {/* Messages */}
                  <Link
                    href="/messages"
                    prefetch={true}
                    className={`relative p-1.5 transition ${
                      checkIsActive('/messages') ? 'text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="الرسائل"
                  >
                    <MessagesIcon className="w-5 h-5" />
                  </Link>

                  {/* Notifications */}
                  <Link
                    href="/notifications"
                    prefetch={true}
                    className={`relative p-1.5 transition ${
                      checkIsActive('/notifications') ? 'text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                    title="الإشعارات"
                  >
                    <BellIcon className="w-5 h-5" />
                    {Boolean(unreadCount > 0) && (
                      <span className="absolute 0 top-0.5 right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[#ed4956] text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="w-7 h-7 rounded-full overflow-hidden border border-white/20 hover:border-white/50 transition shrink-0"
                    title={currentUser.full_name}
                  >
                    <img
                      src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={currentUser.full_name}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute left-0 mt-2 w-60 bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/[0.12] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2.5 border-b border-white/[0.08]">
                        <div className="text-xs font-bold text-white truncate">{currentUser.full_name}</div>
                        <div className="text-[11px] text-zinc-500 font-mono truncate">@{currentUser.username}</div>
                      </div>

                      <div className="py-1">
                        <Link
                          href={`/profile/${currentUser.username}`}
                          prefetch={true}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white font-medium"
                        >
                          <User className="w-4 h-4 text-zinc-400" />
                          <span>الملف الشخصي</span>
                        </Link>
                        
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsCreateTeamOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white font-medium text-right"
                        >
                          <TeamsIcon className="w-4 h-4 text-zinc-400" />
                          <span>تأسيس فريق جديد</span>
                        </button>

                        <Link
                          href="/settings"
                          prefetch={true}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-300 hover:bg-white/10 hover:text-white font-medium"
                        >
                          <SettingsIcon className="w-4 h-4 text-zinc-400" />
                          <span>الإعدادات</span>
                        </Link>

                        {currentUser.role === 'admin' && (
                          <Link
                            href="/admin"
                            prefetch={true}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#0095f6] hover:bg-white/10 font-semibold"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>لوحة الإدارة</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-white/[0.08] pt-2 px-3">
                        <div className="text-[10px] font-semibold text-zinc-500 px-1 mb-1.5">
                          تبديل الحساب السريع:
                        </div>
                        <div className="grid grid-cols-2 gap-1 mb-2">
                          <button
                            onClick={() => handleSwitchAccount('shamikhstudio@gmail.com')}
                            className="px-2 py-1 text-[10px] font-medium rounded bg-white/5 text-zinc-300 hover:bg-white/15 hover:text-white truncate"
                            title="جواد شامخ"
                          >
                            جواد شامخ
                          </button>
                          <button
                            onClick={() => handleSwitchAccount('ahmed@gxesports.com')}
                            className="px-2 py-1 text-[10px] font-medium rounded bg-white/5 text-zinc-300 hover:bg-white/15 hover:text-white truncate"
                            title="كابتن GX"
                          >
                            كابتن GX
                          </button>
                          <button
                            onClick={() => handleSwitchAccount('haider@babylon.network')}
                            className="px-2 py-1 text-[10px] font-medium rounded bg-white/5 text-zinc-300 hover:bg-white/15 hover:text-white truncate"
                            title="ShadowIQ"
                          >
                            ShadowIQ
                          </button>
                          <button
                            onClick={() => handleSwitchAccount('test@test.com')}
                            className="px-2 py-1 text-[10px] font-medium rounded bg-white/5 text-zinc-300 hover:bg-white/15 hover:text-white truncate"
                            title="علي الصدر"
                          >
                            علي الصدر
                          </button>
                        </div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#ed4956] hover:bg-[#ed4956]/10 rounded-lg transition"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>تسجيل الخروج</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    prefetch={true}
                    className="px-3 py-1.5 text-xs font-semibold text-white hover:opacity-80 transition"
                  >
                    دخول
                  </Link>
                  <Link
                    href="/auth/register"
                    prefetch={true}
                    className="px-3 py-1.5 text-xs font-semibold ig-btn-primary rounded-lg"
                  >
                    تسجيل
                  </Link>
                </div>
              )}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-1.5 text-zinc-400 hover:text-white"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-white/[0.08] py-2 space-y-1 bg-black">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = checkIsActive(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    prefetch={true}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${
                      isActive
                        ? 'text-white font-bold bg-white/10'
                        : 'text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={() => {
          setIsCreatePostOpen(false);
          if (typeof window !== 'undefined' && pathname === '/') {
            window.location.reload();
          }
        }}
      />

      <CreateTeamModal
        isOpen={isCreateTeamOpen}
        onClose={() => setIsCreateTeamOpen(false)}
        onTeamCreated={() => {
          setIsCreateTeamOpen(false);
          if (typeof window !== 'undefined' && pathname === '/teams') {
            window.location.reload();
          }
        }}
      />
    </>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<header className="h-14 bg-black border-b border-white/[0.08]" />}>
      <NavbarContent />
    </Suspense>
  );
}