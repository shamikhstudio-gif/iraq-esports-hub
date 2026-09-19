'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from '@/lib/navigation';
import { usePathname, useSearchParams } from '@/lib/navigation';
import {
  ShieldCheck,
  User,
  LogOut,
  Search,
  Menu,
  X,
  Zap,
  Palette
} from 'lucide-react';
import { HomeIcon, TeamsIcon, BellIcon, MessagesIcon, SwordsIcon, SettingsIcon, IehLogo } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Profile, resolveUserAvatar } from '@/lib/types';
import { useUser } from '@/context/UserContext';
import { CreateTeamModal } from './CreateTeamModal';
import { Button, Badge } from '@/components/ui';
import { AvatarWithDecoration } from '@/components/ui/AvatarWithDecoration';

const AUTH_USER_KEY = 'babylon_user_id';

function NavbarContent() {
  const pathname = usePathname();
  useSearchParams(); // triggers Suspense boundary

  const { user: currentUser, logout } = useUser();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState<boolean>(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && Boolean((window as any).electronAPI?.isDesktop)) {
      setIsDesktop(true);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      loadNotificationCount(currentUser.id);
    } else {
      setUnreadCount(0);
    }
  }, [currentUser?.id]);

  const loadNotificationCount = async (userId: string) => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    } catch (err: unknown) {
      console.error('Error loading notification count:', err);
    }
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const checkIsActive = (href: string) => {
    if (href === '/') return pathname === '/';
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
      <header 
        className="sticky z-40 bg-black/90 backdrop-blur-md border-b border-white/[0.08] shrink-0"
        style={{ top: isDesktop ? '32px' : '0px' }}
      >
        <div className="layout-container px-4">
          <div className="flex items-center justify-between h-16">

            {/* Official Logo */}
            <div className="flex items-center gap-4">
              <Link href="/" prefetch={true} className="flex items-center gap-2.5 group" title="شبكة الرياضات الإلكترونية العراقية | IEH">
                <IehLogo size={30} glow={true} />
                <span className="text-xl font-black tracking-tight text-white group-hover:text-zinc-200 transition">
                  IEH
                </span>
              </Link>

              <Link
                href="/teams"
                prefetch={true}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-text-secondary hover:text-white text-xs transition border border-white/[0.05]"
                title="البحث عن الفرق واللاعبين"
              >
                <Search className="w-3.5 h-3.5" />
                <span>بحث...</span>
              </Link>
            </div>

            {/* Center Navigation */}
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
                    className={`relative p-2 rounded-lg transition ${isActive ? 'text-white' : 'text-text-secondary hover:text-white'
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

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {currentUser && (
                <>
                  {/* eBits Balance */}
                  <Link
                    href="/store"
                    title="متجر eBits"
                    className="hidden sm:inline-flex items-center justify-center gap-1.5 px-3 h-8 rounded-full bg-ebits/10 border border-ebits/25 hover:border-ebits/50 hover:bg-ebits/15 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-ebits shrink-0" />
                    <span className="text-xs font-black text-ebits font-mono leading-none flex items-center justify-center">
                      {(currentUser.ebits_balance || 0).toLocaleString()}
                    </span>
                  </Link>

                  {/* Messages */}
                  <Link
                    href="/messages"
                    prefetch={true}
                    className={`relative p-1.5 rounded-lg flex items-center justify-center transition ${checkIsActive('/messages') ? 'text-white' : 'text-text-secondary hover:text-white'
                      }`}
                    title="الرسائل"
                  >
                    <MessagesIcon className="w-5 h-5 shrink-0" />
                  </Link>

                  {/* Notifications */}
                  <Link
                    href="/notifications"
                    prefetch={true}
                    className={`relative p-1.5 rounded-lg flex items-center justify-center transition ${checkIsActive('/notifications') ? 'text-white' : 'text-text-secondary hover:text-white'
                      }`}
                    title="الإشعارات"
                  >
                    <BellIcon className="w-5 h-5 shrink-0" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 bg-white text-black font-black text-[9px] leading-none rounded-full flex items-center justify-center border border-black shadow-sm pointer-events-none select-none">
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
                    className="p-0.5 rounded-xl hover:opacity-80 transition shrink-0 flex items-center justify-center"
                    title={currentUser.full_name}
                  >
                    <AvatarWithDecoration
                      src={resolveUserAvatar(currentUser)}
                      alt={currentUser.full_name}
                      frame={currentUser.equipped_frame || (currentUser.has_neon_frame ? 'neon_pulse' : 'none')}
                      size="xs"
                    />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute left-0 mt-2 w-56 bg-surface-elevated rounded-xl shadow-modal border border-border py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      {/* User info */}
                      <div className="px-4 py-2.5 border-b border-white/[0.08]">
                        <div className="text-xs font-bold text-white truncate">{currentUser.full_name}</div>
                        <div className="text-[11px] text-text-tertiary font-mono truncate">@{currentUser.username}</div>
                      </div>

                      {/* Nav items */}
                      <div className="py-1">
                        <Link
                          href={`/profile/${currentUser.username}`}
                          prefetch={true}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-white hover:bg-white/10 font-semibold"
                        >
                          <User className="w-4 h-4 text-white" />
                          <span>الملف الشخصي</span>
                        </Link>

                        <Link
                          href={`/profile/${currentUser.username}?studio=open`}
                          prefetch={true}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-white hover:bg-white/10 font-semibold"
                        >
                          <Palette className="w-4 h-4 text-white" />
                          <span>استوديو التخصيص</span>
                        </Link>

                        {currentUser.team_id ? (
                          <Link
                            href={`/teams/${currentUser.team_id}`}
                            prefetch={true}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-white hover:bg-white/10 font-semibold"
                          >
                            <TeamsIcon className="w-4 h-4 text-white" />
                            <span>فريقي</span>
                          </Link>
                        ) : (
                          <button
                            onClick={() => { setIsUserMenuOpen(false); setIsCreateTeamOpen(true); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-white hover:bg-white/10 font-semibold text-right"
                          >
                            <TeamsIcon className="w-4 h-4 text-white" />
                            <span>تأسيس فريق جديد</span>
                          </button>
                        )}

                        <Link
                          href="/settings"
                          prefetch={true}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs text-white hover:bg-white/10 font-semibold"
                        >
                          <SettingsIcon className="w-4 h-4 text-white" />
                          <span>الإعدادات</span>
                        </Link>

                        {/* Admin — only rendered if profile.role === 'admin' from DB */}
                        {currentUser.role === 'admin' && (
                          <Link
                            href="/admin"
                            prefetch={true}
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs text-white hover:bg-white/10 font-semibold"
                          >
                            <ShieldCheck className="w-4 h-4 text-white" />
                            <span>لوحة الإدارة</span>
                          </Link>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-white/[0.08] pt-1 px-3 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          fullWidth
                          onClick={handleLogout}
                          rightIcon={<LogOut className="w-3.5 h-3.5" />}
                          className="text-white hover:bg-white/10"
                        >
                          تسجيل الخروج
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/auth/login" prefetch={true}>
                    <Button variant="ghost" size="sm">
                      دخول
                    </Button>
                  </Link>
                  <Link href="/auth/register" prefetch={true}>
                    <Button variant="primary" size="sm">
                      تسجيل
                    </Button>
                  </Link>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden text-zinc-400 hover:text-white"
                title="القائمة"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Dropdown */}
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
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${isActive
                      ? 'text-white font-bold bg-white/10'
                      : 'text-text-secondary hover:text-white hover:bg-white/5'
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


      <CreateTeamModal
        isOpen={isCreateTeamOpen}
        onClose={() => setIsCreateTeamOpen(false)}
        onTeamCreated={() => setIsCreateTeamOpen(false)}
      />
    </>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<header className="h-16 bg-black border-b border-white/[0.08]" />}>
      <NavbarContent />
    </Suspense>
  );
}