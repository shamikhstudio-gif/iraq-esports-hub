import { Icon } from '@/components/ui/Icon';
'use client';

import React, { useState } from 'react';
import { 
  Gamepad2, 
  Globe, 
  Clock, 
  Shield, 
  Swords, 
  CheckCircle2, 
  ExternalLink, 
  ArrowLeft, 
  Play, 
  AlertCircle, 
  Send, 
  Users, 
  Check 
} from 'lucide-react';
import { ScrimLobby, Team, Profile, ScrimChallenge } from '@/lib/types';
import { TeamsIcon, SwordsIcon } from '@/components/icons/CustomIcons';
import { Button, Badge, Card } from '@/components/ui';

interface ScrimLobbyCardProps {
  lobby: ScrimLobby;
  currentUser: Profile | null;
  userTeams: Team[];
  onSendChallenge: (lobbyId: string, challengerTeamId: string) => void;
  onOpenChallengesQueue: (lobby: ScrimLobby) => void;
  onOpenRoom: (lobby: ScrimLobby) => void;
  onCancel?: (lobbyId: string) => void;
}

export function ScrimLobbyCard({
  lobby,
  currentUser,
  userTeams,
  onSendChallenge,
  onOpenChallengesQueue,
  onOpenRoom,
  onCancel,
}: ScrimLobbyCardProps) {
  const hostTeam = lobby.host_team;
  const guestTeam = lobby.guest_team;

  // Action access (Must be captain)
  const isHost = Boolean(currentUser?.id && hostTeam?.captain_id === currentUser.id);
  const isGuest = Boolean(guestTeam && currentUser?.id && guestTeam.captain_id === currentUser.id);
  
  // View access (Can be just a member)
  const isParticipant = userTeams.some((t) => t.id === lobby.host_team_id) || (guestTeam ? userTeams.some((t) => t.id === lobby.guest_team_id) : false);

  // Available guest teams belonging to this user (must be captain)
  const availableGuestTeams = userTeams.filter((t) => t.id !== lobby.host_team_id && t.captain_id === currentUser?.id);
  
  // Pending challenges for this lobby
  const pendingChallenges = lobby.challenges?.filter((c) => c.status === 'pending') || [];
  const mySentChallenge = lobby.challenges?.find((c) => 
    c.status === 'pending' && userTeams.some((t) => t.id === c.challenger_team_id)
  );

  const [selectedTeamForChallenge, setSelectedTeamForChallenge] = useState<string>(availableGuestTeams[0]?.id || '');
  const [isSending, setIsSending] = useState(false);

  const isLiveNow = new Date(lobby.scheduled_time).getTime() <= Date.now() + 30 * 60 * 1000;

  const handleSend = () => {
    if (!selectedTeamForChallenge) return;
    setIsSending(true);
    onSendChallenge(lobby.id, selectedTeamForChallenge);
    setTimeout(() => setIsSending(false), 1000);
  };

  return (
    <Card variant="interactive" className="p-5 relative overflow-hidden group">
      {/* Background Glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-b from-white/10 to-transparent"
      />

      {/* Top Meta Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Game badge */}
          <Badge variant="solid" size="sm" icon={<Gamepad2 className="w-3.5 h-3.5" />}>
            <span>{lobby.game}</span>
          </Badge>

          {/* Format */}
          <Badge variant="default" size="xs">
            {lobby.format}
          </Badge>

          {/* Server */}
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
            <Globe className="w-3.5 h-3.5 text-zinc-500" />
            <span>{lobby.server_region}</span>
          </span>
        </div>

        {/* Status / Timing Badge */}
        <div className="flex items-center gap-2">
          {lobby.status === 'open' && (
            <Badge variant="solid" size="xs">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
              <span>{isLiveNow ? 'مفتوح للعب الآن' : 'موعد مجدول'}</span>
            </Badge>
          )}
          {lobby.status === 'accepted' && (
            <Badge variant="default" size="xs">
              تم قبول التحدي • بانتظار الجاهزية
            </Badge>
          )}
          {lobby.status === 'in_progress' && (
            <Badge variant="live" size="xs">
              المباراة جارية الآن
            </Badge>
          )}
          {lobby.status === 'pending_verification' && (
            <Badge variant="outline" size="xs" className="animate-pulse">
              بانتظار تأكيد النتيجة ⏳
            </Badge>
          )}
          {lobby.status === 'disputed' && (
            <Badge variant="solid" size="xs">
              نزاع قيد التحكيم
            </Badge>
          )}
          {lobby.status === 'completed' && (
            <Badge variant="default" size="xs">
              مباراة منتهية وموثقة
            </Badge>
          )}
        </div>
      </div>

      {/* Arena Matchup (Home vs Guest) */}
      <div className="grid grid-cols-11 items-center gap-2 sm:gap-4 py-2 relative z-10">
        
        {/* HOST TEAM (Right in RTL) */}
        <div className="col-span-5 flex items-center justify-end gap-3 text-right min-w-0">
          <div className="truncate">
            <div className="text-xs sm:text-base font-black text-white truncate flex items-center justify-end gap-1.5">
              {(hostTeam?.current_streak || 0) >= 3 && (
                <span className="text-xs font-black text-white bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-white/20" title={`متصل يومياً: ${hostTeam?.current_streak} أيام`}>
                  <Icon name="local_fire_department" size={13} filled className="inline-block align-middle ml-1" />{hostTeam?.current_streak}
                </span>
              )}
              <span>{hostTeam?.name || 'فريق غير معروف'}</span>
            </div>
            <div className="text-[10px] font-mono text-zinc-400 font-bold mt-0.5">
              [{hostTeam?.tag || 'TAG'}] {hostTeam?.city ? `• ${hostTeam.city}` : ''}
            </div>
          </div>

          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black border-2 border-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
            {hostTeam?.logo_url ? (
              <img src={hostTeam.logo_url} alt={hostTeam.name} className="w-full h-full object-cover" />
            ) : (
              <TeamsIcon className="w-6 h-6 text-white" />
            )}
          </div>
        </div>

        {/* VS / SCORE CENTER */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          {lobby.status === 'completed' && (typeof lobby.host_score === 'number' && typeof lobby.guest_score === 'number') ? (
            <div className="px-2.5 py-1 rounded-xl bg-black border border-white/20 font-mono text-sm font-black text-white">
              {lobby.host_score} : {lobby.guest_score}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-xs font-black font-mono text-zinc-400">
              VS
            </div>
          )}
        </div>

        {/* GUEST TEAM (Left in RTL) */}
        <div className="col-span-5 flex items-center justify-start gap-3 text-left min-w-0">
          {guestTeam ? (
            <>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black border-2 border-white/20 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                {guestTeam.logo_url ? (
                  <img src={guestTeam.logo_url} alt={guestTeam.name} className="w-full h-full object-cover" />
                ) : (
                  <TeamsIcon className="w-6 h-6 text-zinc-400" />
                )}
              </div>
              <div className="truncate">
                <div className="text-xs sm:text-base font-black text-white truncate flex items-center gap-1.5">
                  <span>{guestTeam.name}</span>
                  {(guestTeam.current_streak || 0) >= 3 && (
                    <span className="text-xs font-black text-white bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-white/20" title={`متصل يومياً: ${guestTeam.current_streak} أيام`}>
                      <Icon name="local_fire_department" size={13} filled className="inline-block align-middle ml-1" />{guestTeam.current_streak}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-zinc-400 font-bold mt-0.5">
                  [{guestTeam.tag}] {guestTeam.city ? `• ${guestTeam.city}` : ''}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 border-dashed border-white/20 bg-black/95 flex items-center justify-center shrink-0">
                <SwordsIcon className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-zinc-400">
                  بانتظار اختيار الخصم
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {pendingChallenges.length > 0 ? `${pendingChallenges.length} طلب تحدي مقدم` : 'لا توجد طلبات بعد'}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer Details & Action Bar */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          {lobby.min_rank && (
            <span className="px-2 py-0.5 rounded bg-[#161616] text-zinc-300 font-bold border border-white/10">
              المستوى: {lobby.min_rank}
            </span>
          )}
          {lobby.notes && (
            <span className="text-zinc-400 truncate max-w-xs">
              {lobby.notes}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          
          {/* 1. Host controls */}
          {isHost && lobby.status === 'open' && (
            <>
              {pendingChallenges.length > 0 ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Users className="w-3.5 h-3.5" />}
                  onClick={() => onOpenChallengesQueue(lobby)}
                >
                  <span>طلبات التحدي الواردة ({pendingChallenges.length}) • اختر الخصم</span>
                </Button>
              ) : (
                <span className="text-[11px] text-zinc-500 font-bold px-2">
                  بانتظار طلبات التحدي...
                </span>
              )}

              {onCancel && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-zinc-400 hover:text-white"
                  onClick={() => onCancel(lobby.id)}
                >
                  إلغاء التحدي
                </Button>
              )}
            </>
          )}

          {/* 2. Non-host Challenger controls */}
          {!isHost && lobby.status === 'open' && (
            <>
              {mySentChallenge ? (
                <Badge variant="outline" size="sm" icon={<Clock className="w-3.5 h-3.5" />}>
                  <span>تم إرسال طلب التحدي • بانتظار موافقة المستضيف</span>
                </Badge>
              ) : availableGuestTeams.length > 0 ? (
                <div className="flex items-center gap-2">
                  {availableGuestTeams.length > 1 && (
                    <select
                      value={selectedTeamForChallenge}
                      onChange={(e) => setSelectedTeamForChallenge(e.target.value)}
                      className="text-xs p-2 rounded-xl bg-[#141414] border border-white/20 text-white font-bold"
                    >
                      {availableGuestTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          فريق {t.name} [{t.tag}]
                        </option>
                      ))}
                    </select>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Swords className="w-3.5 h-3.5" />}
                    onClick={handleSend}
                    isLoading={isSending}
                  >
                    <span>إرسال طلب تحدي بفريق [{availableGuestTeams.find(t => t.id === selectedTeamForChallenge)?.tag || availableGuestTeams[0]?.tag}]</span>
                  </Button>
                </div>
              ) : null}
            </>
          )}

          {/* 3. Match Room entry (Accepted / In-Progress / Completed) */}
          {isParticipant && lobby.status !== 'open' && lobby.status !== 'cancelled' && (
            <Button
              variant="primary"
              size="sm"
              icon={<Play className="w-3.5 h-3.5 fill-current" />}
              onClick={() => onOpenRoom(lobby)}
            >
              <span>دخول غرفة المباراة (Match Room)</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
