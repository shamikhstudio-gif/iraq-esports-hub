'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Scale, 
  Eye, 
  X, 
  ImageIcon, 
  Swords, 
  Trophy, 
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { SupportTicket, ScrimLobby } from '@/lib/types';
import { TeamsIcon } from '@/components/icons/CustomIcons';
import { Button, Badge } from '@/components/ui';

interface AppealsTabProps {
  tickets: SupportTicket[];
  disputedLobbies?: ScrimLobby[];
  onResolveTicket: (ticketId: string, userId: string) => void;
  onResolveDispute?: (lobbyId: string, hostScore: number, guestScore: number) => Promise<void>;
}

export function AppealsTab({
  tickets,
  disputedLobbies = [],
  onResolveTicket,
  onResolveDispute,
}: AppealsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'disputes' | 'appeals'>('disputes');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [resolvingLobbyId, setResolvingLobbyId] = useState<string | null>(null);

  // Dispute ruling states per lobby
  const [rulings, setRulings] = useState<Record<string, { hostScore: number; guestScore: number }>>({});

  const handleScoreChange = (lobbyId: string, field: 'hostScore' | 'guestScore', val: number) => {
    setRulings((prev) => ({
      ...prev,
      [lobbyId]: {
        hostScore: field === 'hostScore' ? val : prev[lobbyId]?.hostScore ?? 0,
        guestScore: field === 'guestScore' ? val : prev[lobbyId]?.guestScore ?? 0,
      },
    }));
  };

  const handleAdminRule = async (lobby: ScrimLobby) => {
    if (!onResolveDispute) return;
    const ruling = rulings[lobby.id] || {
      hostScore: lobby.host_score ?? 0,
      guestScore: lobby.guest_score ?? 0,
    };

    setResolvingLobbyId(lobby.id);
    try {
      await onResolveDispute(lobby.id, ruling.hostScore, ruling.guestScore);
    } catch (err) {
      console.error('Error resolving dispute:', err);
    } finally {
      setResolvingLobbyId(null);
    }
  };

  const disputeTickets = tickets.filter((t) => t.category === 'scrim_dispute' || t.lobby_id);
  const regularTickets = tickets.filter((t) => t.category !== 'scrim_dispute' && !t.lobby_id);

  return (
    <div className="space-y-5 text-right" dir="rtl">
      {/* Sub Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <Button
          type="button"
          onClick={() => setActiveSubTab('disputes')}
          variant={activeSubTab === 'disputes' ? 'primary' : 'ghost'}
          size="sm"
          icon={<Scale className="w-3.5 h-3.5" />}
          className="font-black"
        >
          نزاعات السكريمات والتحكيم ({disputedLobbies.length})
        </Button>

        <Button
          type="button"
          onClick={() => setActiveSubTab('appeals')}
          variant={activeSubTab === 'appeals' ? 'primary' : 'ghost'}
          size="sm"
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          className="font-black"
        >
          استئنافات تعليق الحسابات ({regularTickets.length})
        </Button>
      </div>

      {/* DISPUTES SECTION */}
      {activeSubTab === 'disputes' && (
        <div className="space-y-4">
          {disputedLobbies.length === 0 ? (
            <div className="ig-card p-12 text-center text-zinc-400 text-xs font-medium space-y-2">
              <Scale className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="font-bold text-zinc-300">لا توجد نزاعات سكريم معلقة حالياً</p>
              <p className="text-[11px] text-zinc-500">كافة المباريات موثقة بنجاح أو منتهية بالتراضي بين الفرق.</p>
            </div>
          ) : (
            disputedLobbies.map((lobby) => {
              const currentRuling = rulings[lobby.id] || {
                hostScore: lobby.host_score ?? 0,
                guestScore: lobby.guest_score ?? 0,
              };

              return (
                <div 
                  key={lobby.id} 
                  className="rounded-2xl bg-[#0e0e0e] border border-white/20 p-5 space-y-4 shadow-lg relative overflow-hidden"
                >
                  {/* Glowing warning accent */}
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-white via-zinc-400 to-white" />

                  {/* Header */}
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="solid" size="sm" className="gap-1.5 font-black">
                        <Scale className="w-3.5 h-3.5" />
                        <span>نزاع قيد التحكيم الرسمي</span>
                      </Badge>
                      <span className="text-xs font-bold text-zinc-400">
                        {lobby.game} • {lobby.format}
                      </span>
                    </div>

                    <span className="text-[11px] text-zinc-500 font-mono">
                      معرف اللوبي: {lobby.id.slice(0, 8)}
                    </span>
                  </div>

                  {/* Teams Matchup Header */}
                  <div className="grid grid-cols-11 items-center gap-3 p-3 rounded-xl bg-black/60 border border-white/10">
                    <div className="col-span-5 flex items-center justify-end gap-2 text-right">
                      <div>
                        <div className="text-xs font-black text-white">{lobby.host_team?.name}</div>
                        <div className="text-[10px] font-mono text-zinc-400">[{lobby.host_team?.tag}] (المستضيف)</div>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-black border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                        {lobby.host_team?.logo_url ? (
                          <img src={lobby.host_team.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <TeamsIcon className="w-4 h-4 text-white" />
                        )}
                      </div>
                    </div>

                    <div className="col-span-1 text-center font-mono font-black text-xs text-zinc-500">VS</div>

                    <div className="col-span-5 flex items-center justify-start gap-2 text-left">
                      <div className="w-8 h-8 rounded-lg bg-black border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                        {lobby.guest_team?.logo_url ? (
                          <img src={lobby.guest_team.logo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <TeamsIcon className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">{lobby.guest_team?.name}</div>
                        <div className="text-[10px] font-mono text-zinc-400">[{lobby.guest_team?.tag}] (الخصم)</div>
                      </div>
                    </div>
                  </div>

                  {/* Dispute Reason */}
                  {lobby.dispute_reason && (
                    <div className="p-3.5 rounded-xl bg-white/10 border border-white/20 text-xs space-y-1">
                      <span className="text-white font-bold text-[11px] block">سبب الاعتراض من الفريق المعترض:</span>
                      <p className="text-white font-medium leading-relaxed">{lobby.dispute_reason}</p>
                    </div>
                  )}

                  {/* Side-by-side Proof Images */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Host Proof */}
                    <div className="p-3 rounded-xl bg-black border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                        <span>إثبات المستضيف ({lobby.host_team?.tag})</span>
                        {lobby.host_score !== null && (
                          <span className="font-mono text-white">ادعى النتيجة: {lobby.host_score}</span>
                        )}
                      </div>
                      {lobby.proof_url ? (
                        <div 
                          className="h-36 rounded-lg bg-zinc-900 overflow-hidden cursor-pointer relative group border border-white/10"
                          onClick={() => setPreviewImage(lobby.proof_url || null)}
                        >
                          <img src={lobby.proof_url} alt="Host Proof" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-xs text-white">
                            <Eye className="w-4 h-4" />
                            <span>تكبير</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-36 rounded-lg bg-zinc-950 flex items-center justify-center text-xs text-zinc-600">
                          لم يتم إرفاق صورة
                        </div>
                      )}
                    </div>

                    {/* Guest Counter Proof */}
                    <div className="p-3 rounded-xl bg-black border border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300">
                        <span>إثبات الخصم المضاد ({lobby.guest_team?.tag})</span>
                        {lobby.guest_score !== null && (
                          <span className="font-mono text-white">ادعى النتيجة: {lobby.guest_score}</span>
                        )}
                      </div>
                      {lobby.guest_proof_url ? (
                        <div 
                          className="h-36 rounded-lg bg-zinc-900 overflow-hidden cursor-pointer relative group border border-white/10"
                          onClick={() => setPreviewImage(lobby.guest_proof_url || null)}
                        >
                          <img src={lobby.guest_proof_url} alt="Guest Proof" className="w-full h-full object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5 text-xs text-white">
                            <Eye className="w-4 h-4" />
                            <span>تكبير</span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-36 rounded-lg bg-zinc-950 flex items-center justify-center text-xs text-zinc-600">
                          لم يتم إرفاق إثبات مضاد
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Admin Ruling Box */}
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-white/15 space-y-3">
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-white" />
                      <span>حكم الإدارة الرسمي واعتماد النتيجة النهائية</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Score inputs */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-zinc-400 font-bold">نقاط [{lobby.host_team?.tag}]:</label>
                          <input
                            type="number"
                            value={currentRuling.hostScore}
                            onChange={(e) => handleScoreChange(lobby.id, 'hostScore', parseInt(e.target.value, 10) || 0)}
                            className="w-14 h-9 text-center font-mono font-black text-sm rounded-lg bg-black border border-white/20 text-white"
                          />
                        </div>

                        <span className="font-mono text-zinc-500 font-bold">:</span>

                        <div className="flex items-center gap-2">
                          <label className="text-xs text-zinc-400 font-bold">نقاط [{lobby.guest_team?.tag}]:</label>
                          <input
                            type="number"
                            value={currentRuling.guestScore}
                            onChange={(e) => handleScoreChange(lobby.id, 'guestScore', parseInt(e.target.value, 10) || 0)}
                            className="w-14 h-9 text-center font-mono font-black text-sm rounded-lg bg-black border border-white/20 text-white"
                          />
                        </div>
                      </div>

                      {/* Rule Button */}
                      <Button
                        type="button"
                        onClick={() => handleAdminRule(lobby)}
                        isLoading={resolvingLobbyId === lobby.id}
                        icon={<CheckCircle2 className="w-4 h-4 stroke-[2.5]" />}
                        variant="primary"
                        size="md"
                        className="w-full sm:w-auto font-black"
                      >
                        حسم النزاع واعتماد النتيجة رسمياً
                      </Button>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* REGULAR APPEALS SECTION */}
      {activeSubTab === 'appeals' && (
        <div className="space-y-3">
          {regularTickets.length === 0 ? (
            <div className="ig-card p-12 text-center text-zinc-400 text-xs font-medium">
              لا توجد تذاكر استئناف مفتوحة حالياً.
            </div>
          ) : (
            regularTickets.map((ticket) => (
              <div key={ticket.id} className="ig-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-sm text-white">{ticket.subject}</span>
                    <Badge variant={ticket.status === 'resolved' ? 'solid' : 'outline'} size="xs">
                      {ticket.status === 'resolved' ? 'تمت المعالجة وقبول الاستئناف' : 'قيد المراجعة الإدارية'}
                    </Badge>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                    {ticket.message || ticket.description}
                  </p>

                  <div className="text-[11px] text-zinc-400 flex items-center gap-2 font-medium">
                    <span>صاحب الاستئناف: {ticket.user?.full_name} (@{ticket.user?.username})</span>
                    <span>•</span>
                    <span className="font-mono">{new Date(ticket.created_at).toLocaleDateString('ar-IQ')}</span>
                  </div>
                </div>

                {ticket.status !== 'resolved' && (
                  <Button
                    onClick={() => onResolveTicket(ticket.id, ticket.user_id)}
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 className="w-4 h-4 text-black" />}
                    className="font-extrabold shrink-0"
                  >
                    قبول الاستئناف وفك التعليق فوراً
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[100000] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20">
            <img src={previewImage} alt="Dispute Proof" className="w-full h-full object-contain max-h-[85vh]" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
