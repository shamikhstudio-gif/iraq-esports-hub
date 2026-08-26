'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Sparkles, Trophy, Loader2, CheckCircle2 } from 'lucide-react';
import { Profile } from '@/lib/types';

export function DailyCheckinWidget() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedUserId) {
      setIsLoading(false);
      return;
    }

    const { data } = await supabase.from('profiles').select('*').eq('id', savedUserId).single();
    if (data) {
      setProfile(data as Profile);
    }
    setIsLoading(false);
  };

  const handleClaim = async () => {
    if (!profile || isClaiming) return;
    setIsClaiming(true);

    try {
      const newXp = (profile.xp || 0) + 50;
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          xp: newXp,
          last_checkin_date: new Date().toISOString(),
        })
        .eq('id', profile.id)
        .select('*')
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data as Profile);
        
        await supabase.from('notifications').insert({
          user_id: profile.id,
          type: 'general',
          title: 'مكافأة الدخول اليومي! 🎁',
          description: 'تمت إضافة +50 XP إلى رصيدك. عد غداً لمكافأة أكبر!',
          is_read: false
        });
      }
    } catch (err) {
      console.error('Error claiming reward:', err);
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading || !profile) return null;

  const today = new Date().toISOString().split('T')[0];
  const lastCheckin = profile.last_checkin_date ? profile.last_checkin_date.split('T')[0] : null;
  const canClaim = lastCheckin !== today;

  const currentXp = profile.xp || 0;
  const xpProgress = (currentXp % 500) / 500 * 100;
  const currentLevel = Math.floor(currentXp / 500) + 1;

  return (
    <div className="ig-card p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold text-xs text-white">المستوى {currentLevel}</h4>
              <span className="text-[10px] text-zinc-400 font-mono font-medium px-1.5 py-0.2 rounded bg-white/5">{currentXp} XP</span>
            </div>
            <div className="w-full sm:w-44 h-1.5 rounded-full bg-white/10 overflow-hidden relative" dir="ltr">
              <div 
                className="absolute top-0 bottom-0 left-0 bg-[#0095f6] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              {500 - (currentXp % 500)} XP للوصول للمستوى التالي
            </p>
          </div>
        </div>

        <button
          onClick={handleClaim}
          disabled={!canClaim || isClaiming}
          className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shrink-0 ${
            canClaim 
              ? 'ig-btn-primary'
              : 'bg-white/5 text-zinc-500 border border-white/10'
          }`}
        >
          {isClaiming ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : !canClaim ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{canClaim ? 'مكافأة الدخول (+50 XP)' : 'تمت المطالبة ✓'}</span>
        </button>
      </div>
    </div>
  );
}
