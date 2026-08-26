'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Swords, 
  Check, 
  Ban, 
  Loader2, 
  Trophy, 
  MapPin, 
  ShieldCheck 
} from 'lucide-react';
import { ScrimLobby, ScrimChallenge, Team } from '@/lib/types';
import { TeamsIcon, SwordsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';

interface IncomingChallengesModalProps {
  lobby: ScrimLobby;
  challenges: ScrimChallenge[];
  isOpen: boolean;
  onClose: () => void;
  onAcceptChallenge: (challenge: ScrimChallenge) => void;
  onDeclineChallenge: (challengeId: string) => void;
}

export function IncomingChallengesModal({
  lobby,
  challenges,
  isOpen,
  onClose,
  onAcceptChallenge,
  onDeclineChallenge,
}: IncomingChallengesModalProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const pendingChallenges = challenges.filter((c) => c.status === 'pending');

  const handleAccept = async (challenge: ScrimChallenge) => {
    setProcessingId(challenge.id);
    try {
      // 1. Mark challenge as accepted
      await supabase
        .from('scrim_challenges')
        .update({ status: 'accepted' })
        .eq('id', challenge.id);

      // 2. Decline any other pending challenges for this lobby
      await supabase
        .from('scrim_challenges')
        .update({ status: 'declined' })
        .eq('lobby_id', lobby.id)
        .neq('id', challenge.id)
        .eq('status', 'pending');

      // 3. Assign guest team and update lobby to 'accepted'
      const { data: updatedLobby, error } = await supabase
        .from('scrim_lobbies')
        .update({
          guest_team_id: challenge.challenger_team_id,
          status: 'accepted',
        })
        .eq('id', lobby.id)
        .select(`
          *,
          host_team:teams!scrim_lobbies_host_team_id_fkey(*),
          guest_team:teams!scrim_lobbies_guest_team_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      onAcceptChallenge(challenge);
      onClose();
    } catch (err) {
      console.error('Error accepting challenge:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (challengeId: string) => {
    setProcessingId(challengeId);
    try {
      await supabase
        .from('scrim_challenges')
        .update({ status: 'declined' })
        .eq('id', challengeId);

      onDeclineChallenge(challengeId);
    } catch (err) {
      console.error('Error declining challenge:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl modal-animate rounded-3xl flex flex-col overflow-hidden text-right text-white border border-white/20 bg-[#0e0e0e] shadow-[0_25px_60px_rgba(0,0,0,0.95)]"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#121212] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-md">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">طلبات التحدي الواردة للسكريم</h3>
              <p className="text-[11px] text-zinc-400">
                اختر الفريق المناسب لمواجهته في اللوبي ({lobby.game} • {lobby.format})
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Challenges List */}
        <div className="p-5 space-y-3 overflow-y-auto max-h-[60vh]">
          {pendingChallenges.length > 0 ? (
            pendingChallenges.map((c) => {
              const team = c.challenger_team;
              const isBusy = processingId === c.id;

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-[#141414] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/25 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-black border border-white/15 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                      {team?.logo_url ? (
                        <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
                      ) : (
                        <TeamsIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-black text-white flex items-center gap-2">
                        <span>{team?.name}</span>
                        <span className="text-[11px] font-mono text-zinc-400 font-bold">[{team?.tag}]</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-500" />
                          <span>{team?.city || 'العراق'}</span>
                        </span>
                        {team?.is_verified && (
                          <span className="text-emerald-400 flex items-center gap-0.5 text-[10px] font-bold">
                            <ShieldCheck className="w-3 h-3" />
                            <span>موثق</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDecline(c.id)}
                      disabled={isBusy}
                      className="px-3.5 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold transition flex items-center gap-1"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>رفض</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAccept(c)}
                      disabled={isBusy}
                      className="px-5 py-2 btn-3d-primary text-black rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md hover:scale-105"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>قبول ومواجهة الفريق</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center rounded-2xl bg-black/40 border border-white/5 space-y-2">
              <SwordsIcon className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400 font-bold">لا توجد طلبات تحدي واردة بانتظار الرد حالياً.</p>
              <p className="text-[11px] text-zinc-500">سيظهر هنا أي فريق يطلب مواجهتكم في هذه الغرفة فوراً.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#101010] border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-bold rounded-xl"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
