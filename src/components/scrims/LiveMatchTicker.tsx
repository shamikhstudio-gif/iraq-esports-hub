'use client';

import React, { useState, useEffect } from 'react';
import { Swords, Radio, Sparkles, Trophy, ArrowLeft, Gamepad2, Scale } from 'lucide-react';
import { ScrimLobby } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { TeamsIcon } from '@/components/icons/CustomIcons';

import { useSwrData } from '@/lib/cache';
import { Badge, Card } from '@/components/ui';

interface LiveMatchTickerProps {
  onSelectLobby?: (lobby: ScrimLobby) => void;
}

export function LiveMatchTicker({ onSelectLobby }: LiveMatchTickerProps) {
  const { data: liveLobbies = [], revalidate } = useSwrData<ScrimLobby[]>(
    'live_match_ticker',
    async () => {
      const { data, error } = await supabase
        .from('scrim_lobbies')
        .select(`
          *,
          host_team:teams!scrim_lobbies_host_team_id_fkey(*),
          guest_team:teams!scrim_lobbies_guest_team_id_fkey(*)
        `)
        .in('status', ['in_progress', 'pending_verification', 'disputed', 'accepted'])
        .order('scheduled_time', { ascending: false })
        .limit(5);

      if (error) return [];
      return (data || []) as ScrimLobby[];
    },
    { ttl: 60_000 }
  );

  useEffect(() => {
    const channel = supabase
      .channel('scrim_ticker_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scrim_lobbies' },
        () => {
          revalidate();
        }
      )
      .subscribe();

    const handleFeedRefresh = () => {
      revalidate();
    };
    window.addEventListener('ieh:refresh-feed', handleFeedRefresh);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('ieh:refresh-feed', handleFeedRefresh);
    };
  }, [revalidate]);

  if (liveLobbies.length === 0) {
    return null;
  }

  return (
    <Card variant="glass" className="w-full mb-6 p-3 shadow-lg">
      <div className="flex items-center justify-between gap-3 mb-2 px-1">
        <div className="flex items-center gap-2">
          <Badge variant="live" size="xs">
            <span>مباريات وسكريمات مباشرة (LIVE)</span>
          </Badge>
          <span className="text-[11px] text-zinc-400 font-bold hidden sm:inline">
            {liveLobbies.length} مواجهة جارية الآن في الساحة
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Matches Strip */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none" dir="rtl">
        {liveLobbies.map((lobby) => {
          const isDisputed = lobby.status === 'disputed';
          const isPending = lobby.status === 'pending_verification';

          return (
            <div
              key={lobby.id}
              onClick={() => onSelectLobby && onSelectLobby(lobby)}
              className="shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all cursor-pointer bg-black/60 border-white/10 hover:border-white/30 hover:bg-white/[0.04]"
            >
              {/* Host Team */}
              <div className="flex items-center gap-2 text-right">
                <div className="w-6 h-6 rounded-lg bg-black border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                  {lobby.host_team?.logo_url ? (
                    <img src={lobby.host_team.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <TeamsIcon className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="text-xs font-black text-white font-mono">[{lobby.host_team?.tag || 'HOST'}]</span>
              </div>

              {/* Score / VS */}
              <div className="px-2 py-0.5 rounded-md bg-white/10 font-mono text-[11px] font-black text-white border border-white/10">
                {typeof lobby.host_score === 'number' && typeof lobby.guest_score === 'number'
                  ? `${lobby.host_score} : ${lobby.guest_score}`
                  : 'VS'}
              </div>

              {/* Guest Team */}
              <div className="flex items-center gap-2 text-left">
                <span className="text-xs font-black text-white font-mono">[{lobby.guest_team?.tag || 'GUEST'}]</span>
                <div className="w-6 h-6 rounded-lg bg-black border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                  {lobby.guest_team?.logo_url ? (
                    <img src={lobby.guest_team.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <TeamsIcon className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
              </div>

              {/* Game & Map Info */}
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-zinc-400 border-r border-white/10 pr-2.5 mr-1 font-medium">
                <span>{lobby.game}</span>
                {lobby.selected_map && <span className="text-white font-bold">• {lobby.selected_map}</span>}
              </div>

              {/* Status Tag */}
              {isDisputed ? (
                <Badge variant="solid" size="xs" icon={<Scale className="w-2.5 h-2.5 text-black" />}>
                  <span>تحكيم</span>
                </Badge>
              ) : isPending ? (
                <Badge variant="outline" size="xs">
                  <span>مراجعة</span>
                </Badge>
              ) : (
                <Badge variant="default" size="xs">
                  <span>مباشر</span>
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
