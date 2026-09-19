'use client';

import React, { useState, useEffect } from 'react';
import Link from '@/lib/navigation';
import { 
  Trophy, 
  Flame, 
  CheckCircle, 
  Plus, 
  ChevronLeft, 
  Sparkles, 
  Search, 
  X 
} from 'lucide-react';
import { TeamsIcon, SwordsIcon, IehLogo } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Team } from '@/lib/types';
import { GameSearchSelect } from './GameSearchSelect';
import { GAMES_LIST, POST_TYPES } from '@/lib/constants';
import { Card, Button, Badge } from '@/components/ui';
import { useSwrData } from '@/lib/cache';

interface SidebarProps {
  activeGame: string;
  onSelectGame: (game: string) => void;
  activeType: string;
  onSelectType: (type: string) => void;
  onCreatePostClick: () => void;
}

export function Sidebar({
  activeGame,
  onSelectGame,
  activeType,
  onSelectType,
  onCreatePostClick
}: SidebarProps) {
  const { data: topTeams = [] } = useSwrData<Team[]>(
    'sidebar_top_teams',
    async () => {
      const { data } = await supabase.from('teams').select('*').limit(3);
      return (data || []) as Team[];
    },
    { ttl: 300_000 }
  );

  // Use centralized lists from constants — no more local duplicates
  const games = GAMES_LIST;
  const types = POST_TYPES.filter((t) => t.id !== 'general'); // sidebar shows scrim/recruit/announce

  return (
    <aside className="space-y-3">
      {/* Quick Action Card */}
      <Card variant="glass" className="p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.08]">
          <IehLogo size={22} glow={true} />
          <div className="text-white font-black text-xs tracking-wide">
            شبكة الرياضات الإلكترونية
          </div>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          نظّم سكريم، ابحث عن لاعبين، أو نافس أقوى الفرق.
        </p>
        <div className="space-y-2 pt-1">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={onCreatePostClick}
            rightIcon={<Plus className="w-4 h-4" />}
          >
            إنشاء منشور جديد
          </Button>
          <Link href="/leaderboards" className="block">
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              rightIcon={<Trophy className="w-3.5 h-3.5 text-white" />}
            >
              لوحة الشرف وتصنيف الفرق
            </Button>
          </Link>
          <Link href="/store" className="block">
            <Button
              variant="outline"
              size="sm"
              fullWidth
              rightIcon={<Sparkles className="w-3.5 h-3.5 text-white" />}
            >
              متجر eBits — eStore
            </Button>
          </Link>
        </div>
      </Card>

      {/* Filter by Type */}
      <Card variant="glass" className="p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
            <SwordsIcon className="w-3.5 h-3.5" />
            <span>نوع المنشور</span>
          </h4>
          {activeType !== 'all' && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onSelectType('all')}
              className="text-zinc-400 hover:text-white"
            >
              الكل
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {types.map((t) => {
            const isSelected = activeType === t.id;
            return (
              <Button
                key={t.id}
                variant={isSelected ? 'primary' : 'outline'}
                size="xs"
                onClick={() => onSelectType(t.id)}
              >
                {t.name}
              </Button>
            );
          })}
        </div>
      </Card>

      {/* Filter by Game */}
      <Card variant="glass" className="p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-zinc-400" />
            <span>الألعاب التنافسية</span>
          </h4>
          {activeGame !== 'all' && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onSelectGame('all')}
              className="text-zinc-400 hover:text-white"
            >
              الكل
            </Button>
          )}
        </div>

        <GameSearchSelect
          mode="single"
          value={activeGame !== 'all' && !games.some((g) => g.id === activeGame) ? activeGame : ''}
          onChange={(val) => onSelectGame(val || 'all')}
          placeholder="ابحث عن لعبة..."
          showSuggestions={false}
        />

        <div className="space-y-1 pt-1">
          {games.map((g) => {
            const isSelected = activeGame === g.id;
            return (
              <Button
                key={g.id}
                variant={isSelected ? 'primary' : 'ghost'}
                size="sm"
                fullWidth
                onClick={() => onSelectGame(g.id)}
                className={`justify-between text-right ${!isSelected ? 'hover:bg-white/5' : ''}`}
                rightIcon={<span>{g.name}</span>}
                leftIcon={isSelected ? <ChevronLeft className="w-3.5 h-3.5" /> : undefined}
              />
            );
          })}
        </div>
      </Card>

      {/* Verified Teams */}
      <Card variant="glass" className="p-4 space-y-2.5">
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
            <TeamsIcon className="w-3.5 h-3.5" />
            <span>فرق مميزة</span>
          </h4>
          <Link href="/teams" className="text-[11px] text-accent hover:underline font-medium">
            عرض الكل
          </Link>
        </div>

        <div className="space-y-1.5">
          {topTeams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/[0.04] transition group"
            >
              <div className="flex items-center gap-2">
                <img
                  src={team.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'}
                  alt={team.name}
                  className="w-7 h-7 rounded-full object-cover border border-white/10"
                />
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-white transition flex items-center gap-1">
                    {team.name}
                    {team.is_verified && <CheckCircle className="w-3 h-3 text-accent" />}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    [{team.tag}] • {team.city}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {/* Footer copyright */}
      <div className="pt-3 border-t border-white/[0.05] flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-mono">
        <IehLogo size={14} />
        <span>© {new Date().getFullYear()} IEH • Powered by eShamikh</span>
      </div>
    </aside>
  );
}