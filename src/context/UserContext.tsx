'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/lib/types';
import { AUTH_USER_KEY } from '@/lib/constants';
import { removeCurrentDeviceSession, checkSessionValidity } from '@/lib/deviceSession';

const CACHED_PROFILE_KEY = 'ieh_cached_user_profile';

interface UserContextValue {
  user: Profile | null;
  userId: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
  updateUser: (partial: Partial<Profile>) => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  userId: null,
  isLoading: true,
  isAdmin: false,
  refreshUser: async () => {},
  updateUser: () => {},
  logout: async () => {},
});

function setAuthCookie(userId: string | null) {
  if (typeof document === 'undefined') return;
  if (userId) {
    document.cookie = `ieh_user_id=${userId}; path=/; max-age=2592000; SameSite=Lax`;
  } else {
    document.cookie = 'ieh_user_id=; path=/; max-age=0; SameSite=Lax';
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  // Synchronous immediate 0ms read from localStorage
  const [userId, setUserId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(AUTH_USER_KEY) || null;
  });

  const [user, setUser] = useState<Profile | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(CACHED_PROFILE_KEY);
      return cached ? (JSON.parse(cached) as Profile) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(!user);

  const fetchUser = useCallback(async () => {
    let savedUserId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
    
    // Fallback: check cookie if localStorage is empty
    if (!savedUserId && typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)ieh_user_id=([^;]+)/);
      if (match && match[1]) {
        savedUserId = match[1];
        localStorage.setItem(AUTH_USER_KEY, savedUserId);
      }
    }

    // Fallback: check active Supabase session (e.g. from Google OAuth redirect)
    if (!savedUserId) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user) {
        const u = sessionData.session.user;
        const { data: p } = await supabase
          .from('profiles')
          .select('id')
          .or(`auth_user_id.eq.${u.id},email.ilike.${u.email}`)
          .maybeSingle();
        if (p) {
          savedUserId = p.id;
          if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_USER_KEY, p.id);
          }
        }
      }
    }

    setUserId(savedUserId);

    if (!savedUserId) {
      setUser(null);
      setAuthCookie(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', savedUserId)
        .single();

      if (data && !error) {
        setUser(data as Profile);
        setAuthCookie(data.id);
        if (typeof window !== 'undefined') {
          localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(data));
        }
      } else {
        setUser(null);
        setAuthCookie(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(CACHED_PROFILE_KEY);
        }
      }
    } catch (err) {
      console.warn('UserContext fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // Listen to Supabase auth state changes (Google OAuth callback)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${session.user.id},auth_user_id.eq.${session.user.id},email.ilike.${session.user.email}`)
          .maybeSingle();

        // If new user via Google, create profile
        if (!profile && session.user.email) {
          const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'لاعب عراقي';
          const emailPrefix = (session.user.email.split('@')[0] || 'player').replace(/[^a-zA-Z0-9_]/g, '');
          const cleanPrefix = /^[a-zA-Z]/.test(emailPrefix) ? emailPrefix : `player_${emailPrefix}`;
          const username = `${cleanPrefix.substring(0, 20)}_${Math.floor(100 + Math.random() * 900)}`;

          const profilePayload = {
            id: session.user.id,
            auth_user_id: session.user.id,
            email: session.user.email.toLowerCase(),
            full_name: googleName,
            username: username,
            role: 'player',
            avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
            city: 'بغداد',
            primary_game: 'Valorant',
            ebits_balance: 50,
          };

          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .upsert(profilePayload, { onConflict: 'id' })
            .select('*')
            .maybeSingle();

          if (newProfile) {
            profile = newProfile;
          } else {
            // If upsert fails because id is auto-generated uuid, try inserting without id
            const { data: retryProfile } = await supabase
              .from('profiles')
              .insert({
                auth_user_id: session.user.id,
                email: session.user.email.toLowerCase(),
                full_name: googleName,
                username: username,
                role: 'player',
                avatar_url: profilePayload.avatar_url,
                city: 'بغداد',
                primary_game: 'Valorant',
                ebits_balance: 50,
              })
              .select('*')
              .maybeSingle();

            if (retryProfile) {
              profile = retryProfile;
            }
          }
        } else if (profile && !profile.auth_user_id) {
          await supabase
            .from('profiles')
            .update({ auth_user_id: session.user.id })
            .eq('id', profile.id);
        }

        if (profile) {
          if (profile.ebits_balance === 0 || profile.ebits_balance == null) {
            const { data: updatedProfile } = await supabase
              .from('profiles')
              .update({ ebits_balance: 50 })
              .eq('id', profile.id)
              .select('*')
              .maybeSingle();
            if (updatedProfile) {
              profile = updatedProfile;
            }
          }

          if (typeof window !== 'undefined') {
            localStorage.setItem(AUTH_USER_KEY, profile.id);
            localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(profile));
          }
          setUser(profile as Profile);
          setUserId(profile.id);
          setAuthCookie(profile.id);
        }
      } else if (event === 'SIGNED_OUT') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(AUTH_USER_KEY);
          localStorage.removeItem(CACHED_PROFILE_KEY);
        }
        setAuthCookie(null);
        setUser(null);
        setUserId(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchUser]);

  // Verify that this device session hasn't been terminated remotely
  useEffect(() => {
    if (!userId) return;

    const verifySession = async () => {
      const isValid = await checkSessionValidity(userId);
      if (!isValid) {
        logout();
      }
    };

    const handleFocus = () => {
      verifySession();
    };

    window.addEventListener('focus', handleFocus);
    const interval = setInterval(verifySession, 60_000); // Check every 60 seconds

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [userId]);

  const updateUser = useCallback((partial: Partial<Profile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const logout = useCallback(async () => {
    const currentUid = userId || (typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null);
    
    // 1. Immediately delete remote & local device session
    try {
      await removeCurrentDeviceSession(currentUid);
    } catch (err) {
      console.warn('Error removing device session on logout:', err);
    }

    // 2. Clear user state and storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(CACHED_PROFILE_KEY);
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-') || key.includes('supabase')) {
            localStorage.removeItem(key);
          }
        });
      } catch {
        // ignore
      }
    }
    setAuthCookie(null);
    setUser(null);
    setUserId(null);

    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore
    }
  }, [userId]);

  const value: UserContextValue = {
    user,
    userId,
    isLoading,
    isAdmin: user?.role === 'admin',
    refreshUser: fetchUser,
    updateUser,
    logout,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
