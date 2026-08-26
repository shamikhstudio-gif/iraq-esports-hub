'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Medal, Gamepad2, Loader2, ArrowUpRight, Users, User, CheckCircle2 } from 'lucide-react';
import { TeamsIcon } from '@/components/icons/CustomIcons';
import Link from 'next/link';

interface TeamStats {
  id: string;
  name: string;
  tag: string;
  logo_url: string | null;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  totalMatches: number;
  current_streak: number;
}

interface PlayerStats {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  primary_game: string;
  city: string;
  totalWins: number;
  totalMatches: number;
  winRate: number;
  is_verified: boolean;
}

export default function LeaderboardsPage() {
  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams');
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameFilter, setGameFilter] = useState<string>('all');

  useEffect(() => {
    fetchLeaderboards();
  }, [gameFilter]);

  const fetchLeaderboards = async () => {
    setIsLoading(true);
    try {
      const { data: teamsData } = await supabase.from('teams').select('id, name, tag, logo_url, current_streak');
      let matchesQuery = supabase.from('team_matches').select('team_id, result, game');
      
      if (gameFilter !== 'all') {
        matchesQuery = matchesQuery.eq('game', gameFilter);
      }
      
      const { data: matchesData } = await matchesQuery;
      const { data: profilesData } = await supabase.from('profiles').select('id, username, full_name, avatar_url, primary_game, city, is_verified');
      const { data: teamMembersData } = await supabase.from('team_members').select('user_id, team_id');

      if (teamsData && matchesData && profilesData && teamMembersData) {
        // 1. Calculate Team Stats
        const teamStatsMap = new Map<string, TeamStats>();
        teamsData.forEach(team => {
          teamStatsMap.set(team.id, {
            id: team.id,
            name: team.name,
            tag: team.tag,
            logo_url: team.logo_url,
            wins: 0,
            losses: 0,
            draws: 0,
            winRate: 0,
            totalMatches: 0,
            current_streak: team.current_streak || 0
          });
        });

        matchesData.forEach(match => {
          const stats = teamStatsMap.get(match.team_id);
          if (stats) {
            stats.totalMatches++;
            if (match.result === 'win') stats.wins++;
            else if (match.result === 'loss') stats.losses++;
            else if (match.result === 'draw') stats.draws++;
            stats.winRate = Math.round((stats.wins / stats.totalMatches) * 100);
          }
        });

        const rankedTeams = Array.from(teamStatsMap.values())
          .filter(t => t.totalMatches > 0)
          .sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.winRate - a.winRate;
          });
        setTeamStats(rankedTeams);

        // 2. Calculate Player Stats (derived from their teams)
        const playerStatsMap = new Map<string, PlayerStats>();
        profilesData.forEach(profile => {
          // If a game filter is active, only include players whose primary game matches
          if (gameFilter !== 'all' && profile.primary_game !== gameFilter) return;
          
          playerStatsMap.set(profile.id, {
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            primary_game: profile.primary_game,
            city: profile.city,
            totalWins: 0,
            totalMatches: 0,
            winRate: 0,
            is_verified: profile.is_verified
          });
        });

        // Sum up team performances for each player
        teamMembersData.forEach(member => {
          const pStats = playerStatsMap.get(member.user_id);
          const tStats = teamStatsMap.get(member.team_id);
          if (pStats && tStats) {
            pStats.totalWins += tStats.wins;
            pStats.totalMatches += tStats.totalMatches;
          }
        });

        const rankedPlayers = Array.from(playerStatsMap.values())
          .map(p => {
            if (p.totalMatches > 0) {
              p.winRate = Math.round((p.totalWins / p.totalMatches) * 100);
            }
            return p;
          })
          .filter(p => p.totalMatches > 0)
          .sort((a, b) => {
            if (b.totalWins !== a.totalWins) return b.totalWins - a.totalWins;
            return b.winRate - a.winRate;
          });
          
        setPlayerStats(rankedPlayers);
      }
    } catch (err) {
      console.error('Error fetching leaderboards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-16">
      <div 
        className="fixed top-0 left-0 right-0 h-[600px] pointer-events-none z-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16, 185, 129, 0.15) 0%, rgba(0,0,0,0) 80%)'
        }}
      />
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 relative z-10 text-right" dir="rtl">
        
        {/* Header Section */}
        <div className="p-8 rounded-3xl bg-[#090909] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-center relative overflow-hidden">
          <Trophy className="w-16 h-16 text-emerald-500 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          <h1 className="text-3xl font-black text-white mb-2">لوحة الشرف وتصنيف أبطال العراق</h1>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto mb-8">
            التصنيف الرسمي للفرق واللاعبين المعتمد على نتائج التحديات والسكريمات الموثقة عبر منصة IEH.
          </p>

          {/* Section Toggles */}
          <div className="flex justify-center mb-6">
            <div className="bg-black/50 border border-white/10 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner">
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                  activeTab === 'teams'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>تصنيف الفرق</span>
              </button>
              <button
                onClick={() => setActiveTab('players')}
                className={`px-6 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                  activeTab === 'players'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <User className="w-4 h-4" />
                <span>تصنيف اللاعبين</span>
              </button>
            </div>
          </div>
          
          {/* Game Filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-6 border-t border-white/5">
            {['all', 'Valorant', 'CS2', 'Rocket League', 'PUBG Mobile', 'Overwatch 2', 'FC24'].map(g => (
              <button
                key={g}
                onClick={() => setGameFilter(g)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  gameFilter === g 
                    ? 'bg-white/10 text-white border border-white/30'
                    : 'bg-[#141414] text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                {g === 'all' ? '🏆 الترتيب العام' : g}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            <p className="text-xs font-bold text-zinc-500">جاري حساب التصنيفات...</p>
          </div>
        ) : activeTab === 'teams' ? (
          // --- TEAMS LEADERBOARD ---
          teamStats.length > 0 ? (
            <div className="bg-[#0c0c0c] rounded-3xl border border-white/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40">
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 w-16 text-center">المركز</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400">الفريق</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 text-center">المباريات</th>
                      <th className="px-6 py-4 text-xs font-bold text-emerald-400 text-center">فوز (W)</th>
                      <th className="px-6 py-4 text-xs font-bold text-red-400 text-center">خسارة (L)</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 text-center">نسبة الفوز</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {teamStats.map((team, idx) => (
                      <tr key={team.id} className="hover:bg-white/5 transition group">
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {idx === 0 ? (
                              <Medal className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                            ) : idx === 1 ? (
                              <Medal className="w-6 h-6 text-zinc-400" />
                            ) : idx === 2 ? (
                              <Medal className="w-6 h-6 text-amber-700" />
                            ) : (
                              <span className="text-sm font-black text-zinc-600">{idx + 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/teams/${team.id}`} className="flex items-center gap-3 group-hover:opacity-80 transition">
                            <div className="w-10 h-10 rounded-xl bg-black border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                              {team.logo_url ? (
                                <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                              ) : (
                                <TeamsIcon className="w-5 h-5 text-zinc-500" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-black text-white flex items-center gap-2">
                                <span>{team.name}</span>
                                {team.current_streak >= 3 && (
                                  <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-amber-500/20" title={`متصل يومياً: ${team.current_streak} أيام`}>
                                    🔥 {team.current_streak}
                                  </span>
                                )}
                                <ArrowUpRight className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition" />
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono font-bold mt-0.5">[{team.tag}]</div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-zinc-300 font-mono">{team.totalMatches}</td>
                        <td className="px-6 py-4 text-center text-sm font-black text-emerald-400 font-mono">{team.wins}</td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-red-400/80 font-mono">{team.losses}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-sm font-black text-white font-mono">{team.winRate}%</div>
                            <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${team.winRate}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center rounded-3xl bg-[#090909] border border-white/10 border-dashed space-y-3 animate-in fade-in">
              <Gamepad2 className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-black text-white">لا توجد بيانات كافية لتصنيف الفرق</h3>
              <p className="text-xs text-zinc-400">العب المزيد من السكريمات الرسمية لدخول فريقك في لوحة الشرف!</p>
            </div>
          )
        ) : (
          // --- PLAYERS LEADERBOARD ---
          playerStats.length > 0 ? (
            <div className="bg-[#0c0c0c] rounded-3xl border border-white/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40">
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 w-16 text-center">المركز</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400">اللاعب</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 text-center">المباريات</th>
                      <th className="px-6 py-4 text-xs font-bold text-emerald-400 text-center">الانتصارات</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 text-center">نسبة الفوز</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {playerStats.map((player, idx) => (
                      <tr key={player.id} className="hover:bg-white/5 transition group">
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {idx === 0 ? (
                              <Medal className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                            ) : idx === 1 ? (
                              <Medal className="w-6 h-6 text-zinc-400" />
                            ) : idx === 2 ? (
                              <Medal className="w-6 h-6 text-amber-700" />
                            ) : (
                              <span className="text-sm font-black text-zinc-600">{idx + 1}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Link href={`/profile/${player.id}`} className="flex items-center gap-3 group-hover:opacity-80 transition">
                            <div className="w-10 h-10 rounded-full bg-black border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                              {player.avatar_url ? (
                                <img src={player.avatar_url} alt={player.username} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-5 h-5 text-zinc-500" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-black text-white flex items-center gap-1.5">
                                <span>{player.full_name || player.username}</span>
                                {player.is_verified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                                <ArrowUpRight className="w-3 h-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition" />
                              </div>
                              <div className="text-[10px] text-zinc-500 font-medium mt-0.5">
                                @{player.username} • {player.primary_game}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-center text-sm font-bold text-zinc-300 font-mono">{player.totalMatches}</td>
                        <td className="px-6 py-4 text-center text-sm font-black text-emerald-400 font-mono">{player.totalWins}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-sm font-black text-white font-mono">{player.winRate}%</div>
                            <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${player.winRate}%` }} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-16 text-center rounded-3xl bg-[#090909] border border-white/10 border-dashed space-y-3 animate-in fade-in">
              <User className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-black text-white">لا توجد بيانات كافية لتصنيف اللاعبين</h3>
              <p className="text-xs text-zinc-400">شارك في المباريات الرسمية مع فريقك لرفع تصنيفك الفردي!</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
