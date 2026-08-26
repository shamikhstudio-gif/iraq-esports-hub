'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { TeamsIcon, SwordsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Team } from '@/lib/types';
import { GameSearchSelect } from './GameSearchSelect';

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
  const [topTeams, setTopTeams] = useState<Team[]>([]);

  useEffect(() => {
    fetchTopTeams();
  }, []);

  const fetchTopTeams = async () => {
    const { data: teamsData } = await supabase
      .from('teams')
      .select('*')
      .limit(3);
    if (teamsData) setTopTeams(teamsData as Team[]);
  };

  const games = [
    { id: 'all', name: 'جميع الألعاب' },
    { id: 'PUBG Mobile', name: 'PUBG Mobile' },
    { id: 'Valorant', name: 'Valorant' },
    { id: 'Counter-Strike 2', name: 'Counter-Strike 2' },
    { id: 'League of Legends', name: 'League of Legends' },
    { id: 'FC24 (FIFA)', name: 'FC24' },
  ];

  const types = [
    { id: 'all', name: 'الكل' },
    { id: 'scrim', name: 'سكريمات' },
    { id: 'recruitment', name: 'طلب لاعبين' },
    { id: 'announcement', name: 'إعلانات' },
  ];

  return (
    <aside className="space-y-3">
      {/* Quick Action Card */}
      <div className="ig-card p-4">
        <div className="flex items-center gap-2 mb-1.5 text-white font-bold text-xs">
          <Flame className="w-4 h-4 text-[#0095f6]" />
          <span>مجتمع الرياضات الإلكترونية</span>
        </div>
        <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
          نظّم سكريم، ابحث عن لاعبين، أو نافس أقوى الفرق.
        </p>
        <button
          onClick={onCreatePostClick}
          className="w-full py-2 px-3 ig-btn-primary rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء منشور جديد</span>
        </button>
        <Link
          href="/leaderboards"
          className="w-full mt-2 py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-white/[0.06]"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>لوحة الشرف وتصنيف الفرق</span>
        </Link>
        <Link
          href="/store"
          className="w-full mt-2 py-2 px-3 bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 hover:text-amber-300 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition border border-amber-500/25 hover:border-amber-500/40"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>متجر eBits — eStore ⚡</span>
        </Link>
      </div>

      {/* Filter by Game */}
      <div className="ig-card p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-zinc-400" />
            <span>الألعاب التنافسية</span>
          </h4>
          {activeGame !== 'all' && (
            <button
              onClick={() => onSelectGame('all')}
              className="text-[10px] text-[#0095f6] hover:underline"
            >
              الكل
            </button>
          )}
        </div>

        <GameSearchSelect
          mode="single"
          value={activeGame !== 'all' && !games.some((g) => g.id === activeGame) ? activeGame : ''}
          onChange={(val) => onSelectGame(val || 'all')}
          placeholder="ابحث عن لعبة..."
          showSuggestions={false}
        />

        <div className="space-y-0.5 pt-1">
          {games.map((g) => {
            const isSelected = activeGame === g.id;
            return (
              <button
                key={g.id}
                onClick={() => onSelectGame(g.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-right ${
                  isSelected
                    ? 'bg-[#0095f6]/15 text-[#0095f6] font-semibold'
                    : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
                }`}
              >
                <span>{g.name}</span>
                {isSelected && <ChevronLeft className="w-3.5 h-3.5 text-[#0095f6]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter by Type */}
      <div className="ig-card p-4">
        <h4 className="font-semibold text-xs text-white mb-2.5 flex items-center gap-1.5">
          <SwordsIcon className="w-3.5 h-3.5" />
          <span>نوع المنشور</span>
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {types.map((t) => {
            const isSelected = activeType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectType(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  isSelected
                    ? 'bg-[#0095f6] text-white font-semibold'
                    : 'bg-white/[0.04] text-zinc-400 hover:text-white border border-white/[0.06]'
                }`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Verified Teams */}
      <div className="ig-card p-4">
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
            <TeamsIcon className="w-3.5 h-3.5" />
            <span>فرق مميزة</span>
          </h4>
          <Link href="/teams" className="text-[11px] text-[#0095f6] hover:underline font-medium">
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
                    {team.is_verified && <CheckCircle className="w-3 h-3 text-[#0095f6]" />}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    [{team.tag}] • {team.city}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer copyright */}
      <div className="pt-2 text-center text-[10px] text-zinc-600 font-mono">
        <span>© {new Date().getFullYear()} IEH • Powered by eShamikh</span>
      </div>
    </aside>
  );
}