'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from '@/lib/navigation';
import { AppleAuthExperience } from './AppleAuthExperience';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { supabase } from '@/lib/supabase';

import { IehLogo } from '@/components/icons/CustomIcons';
import { GlobalBackgroundEffect } from '@/components/fx/GlobalBackgroundEffect';
import { FloatingBetaFeedbackButton } from '@/components/feedback/FloatingBetaFeedbackButton';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();

  // Instant synchronous check: 0ms initial render for authenticated users
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedUserId = localStorage.getItem('babylon_user_id');
    return savedUserId ? true : null;
  });

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem('ieh_cached_user_profile');
      return cached ? (JSON.parse(cached)?.role || null) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    checkAuthState();

    const { data: authSub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthenticated(true);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setCurrentUserRole(null);
      }
    });

    return () => {
      authSub?.subscription?.unsubscribe();
    };
  }, []);

  const checkAuthState = async () => {
    if (typeof window === 'undefined') return;

    let savedUserId = localStorage.getItem('babylon_user_id');

    // Check active Supabase auth session (e.g. fresh from Google OAuth callback)
    if (!savedUserId) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const u = sessionData.session.user;
        const { data: p } = await supabase
          .from('profiles')
          .select('id, is_banned, role')
          .or(`auth_user_id.eq.${u.id},email.ilike.${u.email}`)
          .maybeSingle();

        if (p && !p.is_banned) {
          savedUserId = p.id;
          localStorage.setItem('babylon_user_id', p.id);
          setIsAuthenticated(true);
          setCurrentUserRole(p.role || null);
          return;
        }
      }
    }

    if (!savedUserId) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, is_banned, role')
        .eq('id', savedUserId)
        .maybeSingle();

      if (profile && !profile.is_banned) {
        setIsAuthenticated(true);
        setCurrentUserRole(profile.role || null);
        try {
          const cached = localStorage.getItem('ieh_cached_user_profile');
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.role = profile.role;
            localStorage.setItem('ieh_cached_user_profile', JSON.stringify(parsed));
          }
        } catch {}
      } else if (profile?.is_banned) {
        localStorage.removeItem('babylon_user_id');
        setIsAuthenticated(false);
      } else {
        // Profile exists locally, keep authenticated
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(Boolean(savedUserId));
    }
  };

  const isAuthRoute = pathname?.startsWith('/auth');
  const isCallbackRoute = pathname?.startsWith('/auth/desktop-callback') || pathname?.startsWith('/auth/mobile-callback');
  const protectedRoutes = ['/messages', '/notifications', '/settings', '/admin'];
  const isProtected = protectedRoutes.some((route) => pathname?.startsWith(route));

  // Allow OAuth callback routes through unconditionally
  if (isCallbackRoute) {
    return <>{children}</>;
  }

  // Instant local monochrome splash screen (zero external network requests)
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center select-none">
        <div className="w-20 h-20 rounded-2xl bg-[#121212] border border-white/15 flex items-center justify-center shadow-2xl animate-pulse">
          <IehLogo size={44} glow={true} />
        </div>
      </div>
    );
  }

  // Not authenticated -> Block all access and show auth experience
  if (!isAuthenticated) {
    return (
      <>
        <AppleAuthExperience
          initialMode={pathname?.includes('/register') ? 'register' : 'login'}
          onAuthSuccess={() => {
            setIsAuthenticated(true);
          }}
        />
        <FloatingBetaFeedbackButton />
      </>
    );
  }

  // If authenticated but directly visiting auth routes -> redirect to home
  if (isAuthRoute) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return null;
  }

  const isHomePage = pathname === '/';

  // Authenticated & on regular app routes
  return (
    <div className={`min-h-screen bg-black text-white flex flex-col relative overflow-x-clip ${isHomePage ? 'lg:h-screen lg:overflow-hidden' : ''}`}>
      <GlobalBackgroundEffect />
      <div className={`relative z-10 flex flex-col ${isHomePage ? 'min-h-screen lg:min-h-0 lg:h-screen lg:overflow-hidden' : 'min-h-screen'}`}>
        <Navbar />
        <main className={`flex-1 layout-container px-4 ${
          isHomePage
            ? 'py-3 sm:py-4 lg:py-3.5 lg:min-h-0 lg:overflow-hidden pb-20 lg:pb-0'
            : 'py-5 pb-20 md:pb-6'
        }`}>
          {children}
        </main>
        {!isHomePage && (
          <footer className="hidden md:block border-t border-white/[0.08] py-6 text-center text-xs text-zinc-500">
            <div className="layout-container px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="font-medium text-zinc-500">
                شبكة IEH للرياضات الإلكترونية © 2026 - جميع الحقوق محفوظة
              </div>
              <div className="flex items-center gap-4 text-zinc-500 font-medium">
                <span>admin@iraqesportshub.com</span>
                <span>•</span>
                <span>ميثاق النزاهة التنافسية</span>
                <span>•</span>
                <span>الدعم الفني</span>
              </div>
            </div>
          </footer>
        )}
        <FloatingBetaFeedbackButton />
        <MobileBottomNav />
      </div>
    </div>
  );
}
