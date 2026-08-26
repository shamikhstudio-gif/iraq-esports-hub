'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { AppleAuthExperience } from './AppleAuthExperience';
import { Navbar } from '@/components/Navbar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { supabase } from '@/lib/supabase';

// Dynamically import DotLottiePlayer with ssr: false to prevent SSR hydration crashes
const DotLottiePlayer = dynamic(
  () => import('@dotlottie/react-player').then((mod) => mod.DotLottiePlayer),
  {
    ssr: false,
    loading: () => (
      <div className="w-8 h-8 rounded-full border-2 border-[#0095f6] border-t-transparent animate-spin" />
    ),
  }
);

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Initial fast check from localStorage
    if (typeof window !== 'undefined') {
      const savedUserId = localStorage.getItem('babylon_user_id');
      if (savedUserId) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }

    checkAuthState();

    // Safety timeout: Ensure splash screen never hangs permanently
    const timer = setTimeout(() => {
      setIsAuthenticated((prev) => (prev === null ? false : prev));
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const checkAuthState = async () => {
    if (typeof window === 'undefined') return;

    const savedUserId = localStorage.getItem('babylon_user_id');
    if (!savedUserId) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, is_banned')
        .eq('id', savedUserId)
        .maybeSingle();

      if (profile && !profile.is_banned) {
        setIsAuthenticated(true);
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

  // Lottie Splash Screen — pure animation, pure black background
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center select-none">
        <div className="w-36 h-36 flex items-center justify-center">
          <DotLottiePlayer
            src="https://lottie.host/6442f868-07fa-4857-85a4-14701d70a983/CuWX7HpXuL.lottie"
            autoplay
            loop
          />
        </div>
      </div>
    );
  }

  // Not authenticated -> Show Instagram split-screen auth experience
  if (!isAuthenticated) {
    return (
      <AppleAuthExperience
        initialMode={pathname?.includes('/register') ? 'register' : 'login'}
        onAuthSuccess={() => {
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // If authenticated but directly visiting auth routes
  if (isAuthRoute) {
    return <>{children}</>;
  }

  // Authenticated & on regular app routes
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-[935px] w-full mx-auto px-4 py-5 pb-20 md:pb-6">
        {children}
      </main>
      <footer className="hidden md:block border-t border-white/[0.08] py-6 text-center text-xs text-zinc-500">
        <div className="max-w-[935px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
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
      <MobileBottomNav />
    </div>
  );
}
