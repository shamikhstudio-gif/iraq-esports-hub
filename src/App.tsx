import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGate } from '@/components/auth/AuthGate';
import { RealtimeToaster } from '@/components/RealtimeToaster';
import { UserProvider } from '@/context/UserContext';
import { BackgroundProvider } from '@/context/BackgroundContext';
import { FontProvider } from '@/context/FontContext';

// Pages
import HomePage from '@/app/page';
import TeamsPage from '@/app/teams/page';
import TeamDetailPage from '@/app/teams/[id]/page';
import ScrimsPage from '@/app/scrims/page';
import StorePage from '@/app/store/page';
import LeaderboardsPage from '@/app/leaderboards/page';
import MessagesPage from '@/app/messages/page';
import NotificationsPage from '@/app/notifications/page';
import ProfilePage from '@/app/profile/[username]/page';
import SettingsPage from '@/app/settings/page';
import AdminPage from '@/app/admin/page';
import VerifyPage from '@/app/auth/verify/page';
import LoginPage from '@/app/auth/login/page';
import RegisterPage from '@/app/auth/register/page';
import DesktopCallbackPage from '@/app/auth/desktop-callback/page';
import MobileCallbackPage from '@/app/auth/mobile-callback/page';
import TestLabPage from '@/app/test-lab/page';
import PostDetailPage from '@/app/post/[id]/page';

import { prefetchData } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import { Team, ScrimLobby } from '@/lib/types';

import { DesktopTitleBar } from '@/components/desktop/DesktopTitleBar';

export function App() {
  React.useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.screen?.orientation?.lock) {
        (window.screen.orientation.lock as (orientation: string) => Promise<void>)('portrait').catch(() => {});
      }
    } catch {
      // unsupported
    }

    // Prefetch Teams and Scrims in the background immediately
    const timer = setTimeout(() => {
      prefetchData('teams_list', async () => {
        const { data } = await supabase
          .from('teams')
          .select('*')
          .order('created_at', { ascending: false });
        return (data || []) as Team[];
      });

      prefetchData('scrim_lobbies_all', async () => {
        const { data, error } = await supabase
          .from('scrim_lobbies')
          .select(`
            *,
            host_team:teams!scrim_lobbies_host_team_id_fkey(*),
            guest_team:teams!scrim_lobbies_guest_team_id_fkey(*),
            challenges:scrim_challenges(*, challenger_team:teams!scrim_challenges_challenger_team_id_fkey(*))
          `)
          .order('created_at', { ascending: false });
        if (error) return [];
        return (data || []) as ScrimLobby[];
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <DesktopTitleBar />
      <UserProvider>
        <FontProvider>
          <BackgroundProvider>
            <AuthGate>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/teams" element={<TeamsPage />} />
                <Route path="/teams/:id" element={<TeamDetailPage />} />
                <Route path="/scrims" element={<ScrimsPage />} />
                <Route path="/store" element={<StorePage />} />
                <Route path="/leaderboards" element={<LeaderboardsPage />} />
                <Route path="/messages" element={<MessagesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile/:username" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/auth/verify" element={<VerifyPage />} />
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
                <Route path="/auth/desktop-callback" element={<DesktopCallbackPage />} />
                <Route path="/auth/mobile-callback" element={<MobileCallbackPage />} />
                <Route path="/test-lab" element={<TestLabPage />} />
                <Route path="/design-lab" element={<TestLabPage />} />
                <Route path="/post/:id" element={<PostDetailPage />} />
                <Route path="/posts/:id" element={<PostDetailPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthGate>
            <RealtimeToaster />
          </BackgroundProvider>
        </FontProvider>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;
