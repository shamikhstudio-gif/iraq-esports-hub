'use client';

import React from 'react';
import Link from 'next/link';
import { Gamepad2, Calendar, Trash2, Trophy, Flame } from 'lucide-react';
import { TeamMatch, Team } from '@/lib/types';
import { TeamsIcon, SwordsIcon } from '@/components/icons/CustomIcons';

interface MatchScoreboardCardProps {
  match: TeamMatch;
  currentTeam: Team;
  onDelete?: (matchId: string) => void;
  canManage?: boolean;
}

export function MatchScoreboardCard({
  match,
  currentTeam,
  onDelete,
  canManage = false,
}: MatchScoreboardCardProps) {
  // Parse scores
  let homeScore = match.our_score ?? 0;
  let awayScore = match.opponent_score ?? 0;

  if (match.score && (homeScore === 0 && awayScore === 0)) {
    const parts = match.score.split(/[-–:]/).map((s) => parseInt(s.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      homeScore = parts[0];
      awayScore = parts[1];
    }
  }

  const isHomeWinner = homeScore > awayScore;
  const isAwayWinner = awayScore > homeScore;
  const isDraw = homeScore === awayScore;

  const opponentTeam = match.opponent_team;
  const opponentName = opponentTeam?.name || match.opponent_name || 'فريق منافس';
  const opponentTag = opponentTeam?.tag || 'IEH';
  const opponentLogo = opponentTeam?.logo_url || match.opponent_logo;
  const opponentLink = match.opponent_team_id ? `/teams/${match.opponent_team_id}` : null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#090909] border border-white/15 p-4 sm:p-5 shadow-[0_15px_35px_rgba(0,0,0,0.85)] hover:border-white/30 transition-all group">
      {/* Background Winner Ambient Glow */}
      <div 
        className={`absolute inset-0 pointer-events-none opacity-20 transition-opacity duration-300 ${
          isHomeWinner 
            ? 'bg-gradient-to-l from-emerald-500/20 via-transparent to-transparent' 
            : isAwayWinner 
            ? 'bg-gradient-to-r from-emerald-500/20 via-transparent to-transparent' 
            : 'bg-gradient-to-b from-white/5 to-transparent'
        }`} 
      />

      {/* Top Meta Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 text-white font-black text-[11px] border border-white/15 shadow-xs">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>{match.game}</span>
          </div>
          <span className="text-zinc-500 font-medium text-[11px]">مباراة رسمية (Match)</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono font-medium">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <span>{new Date(match.match_date).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          {canManage && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(match.id)}
              className="p-1 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition"
              title="حذف نتيجة المباراة"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scoreboard Arena Layout (Football / Final Match Style) */}
      <div className="grid grid-cols-11 items-center gap-2 sm:gap-4 relative z-10 py-1">
        
        {/* TEAM A (Home / Current Team) - 4 cols */}
        <div className="col-span-4 flex items-center justify-end gap-2.5 sm:gap-3.5 text-right min-w-0">
          <div className="min-w-0 truncate">
            <div className={`text-xs sm:text-base font-black truncate ${isHomeWinner ? 'text-white' : 'text-zinc-300'}`}>
              {currentTeam.name}
            </div>
            <div className="text-[10px] font-mono text-zinc-400 font-bold mt-0.5">
              [{currentTeam.tag}]
            </div>
          </div>

          <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-black overflow-hidden flex items-center justify-center shrink-0 border-2 shadow-md ${
            isHomeWinner ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'border-white/15'
          }`}>
            {currentTeam.logo_url ? (
              <img src={currentTeam.logo_url} alt={currentTeam.name} className="w-full h-full object-cover" />
            ) : (
              <TeamsIcon className="w-6 h-6 text-white" />
            )}
          </div>
        </div>

        {/* SCORE CENTER - 3 cols */}
        <div className="col-span-3 flex flex-col items-center justify-center">
          <div className="px-3.5 py-1.5 sm:px-6 sm:py-2.5 rounded-2xl bg-black/90 border border-white/25 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)] font-mono text-xl sm:text-3xl font-black tracking-wider flex items-center gap-2 sm:gap-3">
            <span className={isHomeWinner ? 'text-emerald-400' : isHomeWinner === false && !isDraw ? 'text-zinc-500' : 'text-white'}>
              {homeScore}
            </span>
            <span className="text-zinc-600 font-bold text-sm sm:text-xl">:</span>
            <span className={isAwayWinner ? 'text-emerald-400' : isAwayWinner === false && !isDraw ? 'text-zinc-500' : 'text-white'}>
              {awayScore}
            </span>
          </div>

          <div className="mt-1.5">
            <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400">
              النتيجة النهائية
            </span>
          </div>
        </div>

        {/* TEAM B (Away / Opponent Team) - 4 cols */}
        <div className="col-span-4 flex items-center justify-start gap-2.5 sm:gap-3.5 text-left min-w-0">
          <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-black overflow-hidden flex items-center justify-center shrink-0 border-2 shadow-md ${
            isAwayWinner ? 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 'border-white/15'
          }`}>
            {opponentLogo ? (
              <img src={opponentLogo} alt={opponentName} className="w-full h-full object-cover" />
            ) : (
              <TeamsIcon className="w-6 h-6 text-zinc-400" />
            )}
          </div>

          <div className="min-w-0 truncate">
            <div className="truncate">
              {opponentLink ? (
                <Link
                  href={opponentLink}
                  className={`text-xs sm:text-base font-black truncate hover:underline ${isAwayWinner ? 'text-white' : 'text-zinc-300'}`}
                >
                  {opponentName}
                </Link>
              ) : (
                <span className={`text-xs sm:text-base font-black truncate ${isAwayWinner ? 'text-white' : 'text-zinc-300'}`}>
                  {opponentName}
                </span>
              )}
            </div>
            <div className="text-[10px] font-mono text-zinc-400 font-bold mt-0.5">
              [{opponentTag}]
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
