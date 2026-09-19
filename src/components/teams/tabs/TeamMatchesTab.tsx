'use client';

import React from 'react';
import { 
  Trophy, 
  Loader2, 
  Plus 
} from 'lucide-react';
import { SwordsIcon } from '@/components/icons/CustomIcons';
import { Team, TeamMatch } from '@/lib/types';
import { TeamSearchSelect } from '@/components/TeamSearchSelect';
import { GameSearchInput } from '@/components/GameSearchInput';
import { MatchScoreboardCard } from '@/components/MatchScoreboardCard';
import { Button, Badge, Card } from '@/components/ui';

interface TeamMatchesTabProps {
  team: Team;
  matches: TeamMatch[];
  selectedOpponentTeam: Team | null;
  setSelectedOpponentTeam: (team: Team | null) => void;
  newMatchGame: string;
  setNewMatchGame: (game: string) => void;
  newMatchOurScore: string | number;
  setNewMatchOurScore: (score: string | number) => void;
  newMatchOpponentScore: string | number;
  setNewMatchOpponentScore: (score: string | number) => void;
  handleAddMatch: () => void;
  handleDeleteMatch: (id: string) => void;
  isLoading: boolean;
}

export function TeamMatchesTab({
  team,
  matches,
  selectedOpponentTeam,
  setSelectedOpponentTeam,
  newMatchGame,
  setNewMatchGame,
  newMatchOurScore,
  setNewMatchOurScore,
  newMatchOpponentScore,
  setNewMatchOpponentScore,
  handleAddMatch,
  handleDeleteMatch,
  isLoading,
}: TeamMatchesTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-2">
          <SwordsIcon className="w-4 h-4 text-white" />
          <span>سجل المباريات والسكريمات</span>
        </h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          سجل تاريخ مباريات الفريق ضد الأندية والفرق المسجلة في شبكة IEH
        </p>
      </div>

      {/* Log Match Form */}
      <Card variant="elevated" className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h4 className="text-xs font-black text-white flex items-center gap-2">
            <Trophy className="w-4 h-4 text-white" />
            <span>تسجيل نتيجة مباراة جديدة</span>
          </h4>
          <span className="text-[10px] text-zinc-400 font-mono font-bold">
            لوحة تسجيل المباريات
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Opponent Selection (Must be in IEH) */}
          <div>
            <TeamSearchSelect
              label="الفريق الخصم (من أندية IEH) *"
              value={selectedOpponentTeam?.id}
              onSelect={setSelectedOpponentTeam}
              excludeTeamId={team.id}
              placeholder="ابحث عن اسم أو تاغ الفريق الخصم..."
            />
          </div>

          {/* Game Search Input */}
          <div>
            <GameSearchInput
              label="اللعبة *"
              value={newMatchGame}
              onChange={(val) => setNewMatchGame(val)}
              placeholder="ابحث عن اللعبة أو اكتب اسمها..."
            />
          </div>
        </div>

        {/* Symmetrically Centered Scoreboard Inputs */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#080808] border border-white/10 space-y-3">
          <div className="text-[11px] font-mono font-bold text-zinc-400 text-center tracking-widest uppercase">
            النتيجة النهائية للمباراة (Final Score)
          </div>
          
          <div className="flex items-center justify-between gap-4 max-w-xl mx-auto w-full">
            {/* Home Team (Right side in RTL) */}
            <div className="flex-1 w-0 min-w-0 flex items-center justify-end gap-2 text-right">
              <div className="truncate">
                <div className="text-xs sm:text-sm font-black text-white truncate">{team.name}</div>
                <div className="text-[10px] font-mono text-zinc-400 font-bold">[{team.tag}]</div>
              </div>
            </div>

            {/* Center Score Inputs */}
            <div className="shrink-0 flex items-center justify-center gap-2 sm:gap-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={newMatchOurScore}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setNewMatchOurScore(val);
                }}
                className="w-14 h-12 text-center text-xl font-black font-mono rounded-xl bg-black border border-white/20 text-white focus:outline-none focus:border-white p-0 m-0 shadow-inner flex items-center justify-center leading-none"
              />
              <span className="text-xl font-black text-zinc-500 font-mono select-none px-1">:</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={newMatchOpponentScore}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setNewMatchOpponentScore(val);
                }}
                className="w-14 h-12 text-center text-xl font-black font-mono rounded-xl bg-black border border-white/20 text-white focus:outline-none focus:border-white p-0 m-0 shadow-inner flex items-center justify-center leading-none"
              />
            </div>

            {/* Opponent Team (Left side in RTL) */}
            <div className="flex-1 w-0 min-w-0 flex items-center justify-start gap-2 text-left">
              <div className="truncate">
                <div className="text-xs sm:text-sm font-black text-white truncate">
                  {selectedOpponentTeam ? selectedOpponentTeam.name : 'الخصم'}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 font-bold">
                  [{selectedOpponentTeam ? selectedOpponentTeam.tag : 'IEH'}]
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4 text-black stroke-[3]" />}
            isLoading={isLoading}
            disabled={!selectedOpponentTeam}
            onClick={handleAddMatch}
          >
            <span>توثيق وإضافة النتيجة لسجل الفريق</span>
          </Button>
        </div>
      </Card>

      {/* Matches History List */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h4 className="text-xs font-black text-white">
            سجل المباريات الموثقة ({matches.length})
          </h4>
          <span className="text-[10px] text-zinc-500 font-mono font-bold">
            ترتيب تنازلي حسب التاريخ
          </span>
        </div>

        {matches.length === 0 ? (
          <Card variant="glass" className="p-10 text-center text-zinc-500 text-xs">
            <SwordsIcon className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="font-bold">لم يتم تسجيل نتائج مباريات سابقة بعد.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {matches.map((m) => (
              <MatchScoreboardCard
                key={m.id}
                match={m}
                currentTeam={team}
                onDelete={handleDeleteMatch}
                canManage={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
