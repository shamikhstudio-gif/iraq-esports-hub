'use client';

import React, { useState, useEffect } from 'react';
import { 
  Swords, 
  Plus, 
  Gamepad2, 
  Filter, 
  Flame, 
  Trophy, 
  Globe2, 
  Search, 
  Loader2, 
  Clock, 
  Radio, 
  ShieldCheck 
} from 'lucide-react';
import { SwordsIcon, TeamsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { ScrimLobby, Team, Profile, ScrimChallenge } from '@/lib/types';
import { ScrimLobbyCard } from '@/components/scrims/ScrimLobbyCard';
import { CreateScrimModal } from '@/components/scrims/CreateScrimModal';
import { MatchRoomModal } from '@/components/scrims/MatchRoomModal';
import { IncomingChallengesModal } from '@/components/scrims/IncomingChallengesModal';
import { MercenaryBar } from '@/components/scrims/MercenaryBar';
import { LiveMatchTicker } from '@/components/scrims/LiveMatchTicker';
import { useUser } from '@/context/UserContext';
import { useSwrData } from '@/lib/cache';
import { TeamCardSkeleton, Button, Badge, Card } from '@/components/ui';

export default function ScrimsPage() {
  const { user: currentUser } = useUser();
  const userId = currentUser?.id;

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeRoomLobby, setActiveRoomLobby] = useState<ScrimLobby | null>(null);
  const [incomingChallengesLobby, setIncomingChallengesLobby] = useState<ScrimLobby | null>(null);

  // Filters
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Cached User Teams
  const { data: userTeams = [] } = useSwrData<Team[]>(
    userId ? `scrim_user_teams_${userId}` : null,
    async () => {
      const [memberRes, capRes] = await Promise.all([
        supabase.from('team_members').select('team:teams(*)').eq('user_id', userId!),
        supabase.from('teams').select('*').eq('captain_id', userId!),
      ]);

      const memberTeams = (memberRes.data?.map((m: any) => m.team).filter(Boolean) || []) as Team[];
      const captainTeams = (capRes.data || []) as Team[];
      const teamsMap = new Map<string, Team>();
      [...captainTeams, ...memberTeams].forEach((t) => teamsMap.set(t.id, t));
      return Array.from(teamsMap.values());
    },
    { ttl: 180_000 }
  );

  // 2. Cached Scrim Lobbies with Realtime auto-revalidation
  const {
    data: lobbies = [],
    isLoading,
    revalidate: revalidateLobbies,
    mutate: mutateLobbies,
  } = useSwrData<ScrimLobby[]>(
    'scrim_lobbies_all',
    async () => {
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
    },
    { ttl: 60_000 }
  );

  useEffect(() => {
    const lobbiesChannel = supabase
      .channel('scrim_lobbies_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scrim_lobbies' },
        () => {
          revalidateLobbies();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scrim_challenges' },
        () => {
          revalidateLobbies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(lobbiesChannel);
    };
  }, [revalidateLobbies]);

  // Send Challenge Request (Challenger Flow)
  const handleSendChallenge = async (lobbyId: string, challengerTeamId: string) => {
    try {
      const targetLobby = lobbies.find((l) => l.id === lobbyId);
      if (!targetLobby) return;

      const { data, error } = await supabase
        .from('scrim_challenges')
        .insert({
          lobby_id: lobbyId,
          challenger_team_id: challengerTeamId,
          host_team_id: targetLobby.host_team_id,
          status: 'pending',
        })
        .select(`
          *,
          challenger_team:teams!scrim_challenges_challenger_team_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      await revalidateLobbies();
      alert('تم إرسال طلب التحدي بنجاح إلى كابتن الفريق المستضيف. سيتم إشعاركم فور القبول.');
    } catch (err: any) {
      console.error('Error sending challenge request:', err);
      alert(err.message || 'حدث خطأ أثناء إرسال طلب التحدي');
    }
  };

  // Accept Challenge (Host Flow)
  const handleAcceptIncomingChallenge = async (challenge: ScrimChallenge) => {
    await revalidateLobbies();
    const updated = lobbies.find((l) => l.id === challenge.lobby_id);
    if (updated) {
      setActiveRoomLobby(updated);
    }
  };

  // Cancel Challenge (Host only)
  const handleCancelChallenge = async (lobbyId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا التحدي؟')) return;
    try {
      await supabase
        .from('scrim_lobbies')
        .update({ status: 'cancelled' })
        .eq('id', lobbyId);

      mutateLobbies((prev) => (prev || []).filter((l) => l.id !== lobbyId));
    } catch (err) {
      console.error('Error cancelling lobby:', err);
    }
  };

  // Filtered lobbies
  const filteredLobbies = lobbies.filter((l) => {
    if (l.status === 'cancelled') return false;
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (selectedGame !== 'all' && l.game.toLowerCase() !== selectedGame.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const hostMatch = l.host_team?.name.toLowerCase().includes(q) || l.host_team?.tag.toLowerCase().includes(q);
      const guestMatch = l.guest_team?.name.toLowerCase().includes(q) || l.guest_team?.tag.toLowerCase().includes(q);
      const gameMatch = l.game.toLowerCase().includes(q);
      if (!hostMatch && !guestMatch && !gameMatch) return false;
    }
    return true;
  });

  const liveOpenCount = lobbies.filter((l) => l.status === 'open').length;
  const inProgressCount = lobbies.filter((l) => l.status === 'in_progress').length;

  return (
    <div className="relative min-h-[calc(100vh-4rem)] pb-16 bg-black">
      <div className="layout-container py-6 px-4 space-y-6 relative z-10 text-right" dir="rtl">
        
        {/* Main Hub Header Banner */}
        <Card variant="elevated" className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <Badge variant="solid" size="sm" icon={<Radio className="w-3.5 h-3.5 animate-pulse text-black" />}>
                <span>ساحة السكريمات والتحديات الرسمية (Live Scrims Arena)</span>
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              غرفة الحرب والمواجهات المباشرة بين فرق العراق
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              اطرح تحدياً مفتوحاً، واجه أفضل الأندية، نسق غرف التحكيم وحظر الخرائط، ووثق انتصاراتك تلقائياً في السجل الرسمي.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10">
            <Button
              variant="primary"
              size="md"
              icon={<Plus className="w-4 h-4 stroke-[3]" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              <span>فتح غرفة تحدي وسكريم جديد</span>
            </Button>
          </div>
        </Card>

        {/* Live Active Matches Ticker */}
        <LiveMatchTicker onSelectLobby={(lobby) => setActiveRoomLobby(lobby)} />

        {/* Mercenary / Sub Ring */}
        <MercenaryBar currentUser={currentUser} />

        {/* Filters & Search Control Bar */}
        <Card variant="elevated" className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <Button
                variant={statusFilter === 'all' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                <span>جميع التحديات ({lobbies.length})</span>
              </Button>
              <Button
                variant={statusFilter === 'open' ? 'primary' : 'secondary'}
                size="sm"
                icon={<span className="w-2 h-2 rounded-full bg-current" />}
                onClick={() => setStatusFilter('open')}
              >
                <span>مفتوحة للعب الآن ({liveOpenCount})</span>
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'primary' : 'secondary'}
                size="sm"
                icon={<Swords className="w-3.5 h-3.5" />}
                onClick={() => setStatusFilter('in_progress')}
              >
                <span>جارية الآن ({inProgressCount})</span>
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter('completed')}
              >
                <span>منتهية وموثقة</span>
              </Button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute right-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن فريق أو لعبة..."
                className="w-full text-xs pr-9 pl-3 py-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>

          </div>

          {/* Game Quick Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-white/10">
            {['all', 'Valorant', 'CS2', 'Rocket League', 'PUBG Mobile', 'Overwatch 2', 'League of Legends', 'FC 24'].map((g) => (
              <Button
                key={g}
                variant={selectedGame === g ? 'primary' : 'ghost'}
                size="xs"
                onClick={() => setSelectedGame(g)}
              >
                <span>{g === 'all' ? 'جميع الألعاب' : g}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Lobbies Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <TeamCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredLobbies.length > 0 ? (
          <div className="space-y-4">
            {filteredLobbies.map((lobby) => (
              <ScrimLobbyCard
                key={lobby.id}
                lobby={lobby}
                currentUser={currentUser}
                userTeams={userTeams}
                onSendChallenge={handleSendChallenge}
                onOpenChallengesQueue={(targetLobby) => setIncomingChallengesLobby(targetLobby)}
                onOpenRoom={(targetLobby) => setActiveRoomLobby(targetLobby)}
                onCancel={handleCancelChallenge}
              />
            ))}
          </div>
        ) : (
          <div className="p-16 text-center rounded-3xl border border-dashed border-white/15 bg-[#090909] space-y-3">
            <SwordsIcon className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-black text-white">لا توجد غرف سكريم نشطة مطابقة للبحث حالياً</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              كن السبّاق وافتح غرفة تحدي جديدة لفريقك وادعُ فرق العراق لمواجهتكم!
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4 stroke-[3]" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                <span>فتح غرفة تحدي الآن</span>
              </Button>
            </div>
          </div>
        )}

      </div>

      {/* Create Scrim Modal */}
      {isCreateModalOpen && (
        <CreateScrimModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={(newLobby) => {
            mutateLobbies((prev) => [newLobby, ...(prev || [])]);
            setActiveRoomLobby(newLobby);
          }}
          currentUser={currentUser}
          userTeams={userTeams}
        />
      )}

      {/* Incoming Challenges Queue Modal */}
      {incomingChallengesLobby && (
        <IncomingChallengesModal
          lobby={incomingChallengesLobby}
          challenges={incomingChallengesLobby.challenges || []}
          isOpen={!!incomingChallengesLobby}
          onClose={() => setIncomingChallengesLobby(null)}
          onAcceptChallenge={handleAcceptIncomingChallenge}
          onDeclineChallenge={async () => {
            await revalidateLobbies();
          }}
        />
      )}

      {/* Interactive Match Room Modal */}
      {activeRoomLobby && (
        <MatchRoomModal
          lobby={activeRoomLobby}
          isOpen={!!activeRoomLobby}
          onClose={() => setActiveRoomLobby(null)}
          currentUser={currentUser}
          userTeams={userTeams}
          onUpdateLobby={(updated) => {
            mutateLobbies((prev) => (prev || []).map((l) => (l.id === updated.id ? updated : l)));
            setActiveRoomLobby(updated);
          }}
        />
      )}
    </div>
  );
}
