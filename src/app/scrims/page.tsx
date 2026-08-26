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

export default function ScrimsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [lobbies, setLobbies] = useState<ScrimLobby[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeRoomLobby, setActiveRoomLobby] = useState<ScrimLobby | null>(null);
  const [incomingChallengesLobby, setIncomingChallengesLobby] = useState<ScrimLobby | null>(null);

  useEffect(() => {
    fetchInitialData();

    // Subscribe to Realtime Postgres changes on both scrim_lobbies and scrim_challenges
    const lobbiesChannel = supabase
      .channel('scrim_lobbies_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scrim_lobbies' },
        async () => {
          await fetchLobbies();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scrim_challenges' },
        async () => {
          await fetchLobbies();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(lobbiesChannel);
    };
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;

      // 1. Fetch Current User Profile & User Teams
      if (savedUserId) {
        const [userRes, memberRes, capRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', savedUserId).single(),
          supabase.from('team_members').select('team:teams(*)').eq('user_id', savedUserId),
          supabase.from('teams').select('*').eq('captain_id', savedUserId),
        ]);

        if (userRes.data) setCurrentUser(userRes.data as Profile);

        const memberTeams = (memberRes.data?.map((m: any) => m.team).filter(Boolean) || []) as Team[];
        const captainTeams = (capRes.data || []) as Team[];

        // Deduplicate teams by ID
        const teamsMap = new Map<string, Team>();
        [...captainTeams, ...memberTeams].forEach((t) => teamsMap.set(t.id, t));
        setUserTeams(Array.from(teamsMap.values()));
      }

      // 2. Fetch Lobbies with full joins
      await fetchLobbies();
    } catch (err) {
      console.error('Error loading scrims hub data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLobbies = async () => {
    try {
      const { data, error } = await supabase
        .from('scrim_lobbies')
        .select(`
          *,
          host_team:teams!scrim_lobbies_host_team_id_fkey(*),
          guest_team:teams!scrim_lobbies_guest_team_id_fkey(*),
          challenges:scrim_challenges(*, challenger_team:teams!scrim_challenges_challenger_team_id_fkey(*))
        `)
        .order('created_at', { ascending: false });

      if (data) {
        setLobbies(data as ScrimLobby[]);
      }
    } catch (err) {
      console.error('Error fetching lobbies:', err);
    }
  };

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
      await fetchLobbies();
      alert('تم إرسال طلب التحدي بنجاح إلى كابتن الفريق المستضيف. سيتم إشعاركم فور القبول.');
    } catch (err: any) {
      console.error('Error sending challenge request:', err);
      alert(err.message || 'حدث خطأ أثناء إرسال طلب التحدي');
    }
  };

  // Accept Challenge (Host Flow)
  const handleAcceptIncomingChallenge = async (challenge: ScrimChallenge) => {
    await fetchLobbies();
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

      setLobbies((prev) => prev.filter((l) => l.id !== lobbyId));
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
    <div className="relative min-h-[calc(100vh-4rem)] pb-16">
      {/* Ambient Top Glow */}
      <div 
        className="fixed top-0 left-0 right-0 h-[800px] pointer-events-none z-0 opacity-25"
        style={{
          background: 'radial-gradient(ellipse 100% 60% at 50% -10%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0) 80%)'
        }}
      />

      <div className="max-w-5xl mx-auto py-6 px-4 space-y-6 relative z-10 text-right" dir="rtl">
        
        {/* Main Hub Header Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#090909] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-black border border-red-500/30">
                <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
                <span>ساحة السكريمات والتحديات الرسمية (Live Scrims Arena)</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              غرفة الحرب والمواجهات المباشرة بين فرق العراق
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
              اطرح تحدياً مفتوحاً، واجه أفضل الأندية، نسق غرف التحكيم وحظر الخرائط، ووثق انتصاراتك تلقائياً في السجل الرسمي.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 relative z-10">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3.5 btn-3d-primary text-black rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>فتح غرفة تحدي وسكريم جديد</span>
            </button>
          </div>
        </div>

        {/* Mercenary / Sub Ring */}
        <MercenaryBar currentUser={currentUser} />

        {/* Filters & Search Control Bar */}
        <div className="p-4 rounded-3xl bg-[#0a0a0a] border border-white/15 space-y-4 shadow-md">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition ${
                  statusFilter === 'all'
                    ? 'bg-white text-black shadow-md'
                    : 'bg-[#141414] text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                جميع التحديات ({lobbies.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('open')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-1.5 ${
                  statusFilter === 'open'
                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                    : 'bg-[#141414] text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>مفتوحة للعب الآن ({liveOpenCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-1.5 ${
                  statusFilter === 'in_progress'
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                    : 'bg-[#141414] text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>جارية الآن ({inProgressCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition ${
                  statusFilter === 'completed'
                    ? 'bg-white text-black shadow-md'
                    : 'bg-[#141414] text-zinc-400 hover:text-white border border-white/10'
                }`}
              >
                منتهية وموثقة
              </button>
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
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGame(g)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                  selectedGame === g
                    ? 'bg-white/20 text-white border border-white/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {g === 'all' ? '🎮 جميع الألعاب' : g}
              </button>
            ))}
          </div>
        </div>

        {/* Lobbies Feed */}
        {isLoading ? (
          <div className="p-16 text-center rounded-3xl border border-white/10 bg-[#0a0a0a] space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-white mx-auto" />
            <p className="text-xs text-zinc-400 font-bold">جاري تحميل ساحة وتحديات السكريمات المباشرة...</p>
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
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 btn-3d-primary text-black rounded-xl text-xs font-black shadow-md inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>فتح غرفة تحدي الآن</span>
              </button>
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
            setLobbies((prev) => [newLobby, ...prev]);
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
            await fetchLobbies();
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
            setLobbies((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
            setActiveRoomLobby(updated);
          }}
        />
      )}
    </div>
  );
}
