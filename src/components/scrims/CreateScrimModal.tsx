'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Swords, 
  Gamepad2, 
  Globe2, 
  Clock, 
  Shield, 
  Trophy, 
  Loader2, 
  Check, 
  Plus 
} from 'lucide-react';
import { SwordsIcon, TeamsIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { Team, Profile, ScrimLobby } from '@/lib/types';
import { GameSearchInput } from '@/components/GameSearchInput';
import { CustomSelect } from '@/components/CustomSelect';
import { dispatchScrimCreatedDiscord } from '@/lib/discordDispatcher';
import { Button } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';

interface CreateScrimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLobby: ScrimLobby) => void;
  currentUser: Profile | null;
  userTeams: Team[];
}

export function CreateScrimModal({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  userTeams,
}: CreateScrimModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(userTeams[0]?.id || '');
  const [game, setGame] = useState('Valorant');
  const [format, setFormat] = useState('5v5 BO1');
  const [serverRegion, setServerRegion] = useState('Bahrain (البحرين)');
  const [minRank, setMinRank] = useState('مفتوح لجميع الرتب');
  const [timingType, setTimingType] = useState<'now' | 'tonight' | 'custom'>('now');
  const [customTime, setCustomTime] = useState('21:00');
  const [discordChannel, setDiscordChannel] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setMounted(true);
    if (userTeams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(userTeams[0].id);
    }
  }, [userTeams, selectedTeamId]);

  if (!mounted || !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      setErrorMsg('يجب أن تكون قائداً أو مديراً لفريق لفتح غرفة تحدي وسكريم');
      return;
    }
    if (!game.trim()) {
      setErrorMsg('يرجى تحديد اللعبة');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const scheduledTime = timingType === 'now' 
        ? new Date().toISOString() 
        : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('scrim_lobbies')
        .insert({
          host_team_id: selectedTeamId,
          game: game.trim(),
          format,
          server_region: serverRegion,
          min_rank: minRank,
          scheduled_time: scheduledTime,
          status: 'open',
          discord_channel: discordChannel.trim() || null,
          notes: notes.trim() || null,
        })
        .select(`
          *,
          host_team:teams!scrim_lobbies_host_team_id_fkey(*)
        `)
        .single();

      if (error) throw error;
      if (data) {
        triggerHaptic('scrimMatch');
        if (data.host_team) {
          dispatchScrimCreatedDiscord(data.host_team as Team, data as ScrimLobby).catch((err) =>
            console.error('Discord dispatch error on scrim create:', err)
          );
        }
        onSuccess(data as ScrimLobby);
        onClose();
      }
    } catch (err: any) {
      console.error('Error creating scrim lobby:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء فتح غرفة السكريم');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/95"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl modal-animate rounded-3xl flex flex-col overflow-hidden text-right text-white border border-white/15 bg-[#0e0e0e] shadow-sm"
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
              <h3 className="text-base font-black text-white">فتح غرفة سكريم وتحدي جديد</h3>
              <p className="text-[11px] text-zinc-400">اطرح تحدياً مفتوحاً لفرق العراق في ساحة السكريمات</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {userTeams.length === 0 ? (
            <div className="p-6 text-center rounded-2xl border border-dashed border-white/15 bg-[#080808] space-y-2">
              <Shield className="w-8 h-8 text-zinc-500 mx-auto" />
              <p className="text-xs font-bold text-zinc-300">يجب أن تكون كابتن أو عضو في فريق لفتح تحدي سكريم</p>
              <p className="text-[11px] text-zinc-500">قم بإنشاء فريق أو الانضمام لأحد الفرق من دليل الأندية أولاً.</p>
            </div>
          ) : (
            <>
              {/* Host Team Select */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">الفريق المستضيف للتحدي *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {userTeams.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTeamId(t.id)}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-right transition ${
 selectedTeamId === t.id
 ? 'bg-white text-black border-white shadow-md'
 : 'bg-[#141414] border-white/10 text-white hover:border-white/30'
 }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-black overflow-hidden flex items-center justify-center shrink-0 border border-white/15">
                        {t.logo_url ? (
                          <img src={t.logo_url} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          <TeamsIcon className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-black truncate">{t.name}</div>
                        <div className={`text-[10px] font-mono font-bold ${selectedTeamId === t.id ? 'text-zinc-700' : 'text-zinc-400'}`}>
                          [{t.tag}]
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Search & Format Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <GameSearchInput
                  label="اللعبة *"
                  value={game}
                  onChange={setGame}
                  placeholder="اختر اللعبة..."
                />

                <CustomSelect
                  label="نظام ونمط المواجهة:"
                  value={format}
                  onChange={setFormat}
                  options={[
                    { value: '5v5 BO1', label: '5v5 (خريطة واحدة BO1)' },
                    { value: '5v5 BO3', label: '5v5 (ثلاث خرائط BO3)' },
                    { value: '3v3 BO1', label: '3v3 (خريطة واحدة)' },
                    { value: '2v2 BO1', label: '2v2 (ثنائي)' },
                    { value: 'سلسلة سكريمات', label: 'سلسلة تدريب ممتدة (Scrim War)' },
                  ]}
                />
              </div>

              {/* Server & Rank Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CustomSelect
                  label="السيرفر / المنطقة:"
                  value={serverRegion}
                  onChange={setServerRegion}
                  options={[
                    { value: 'Bahrain (البحرين)', label: 'البحرين (Middle East - Bahrain)' },
                    { value: 'Dubai (دبي)', label: 'دبي (UAE - Dubai)' },
                    { value: 'Frankfurt (أوروبا)', label: 'فرانكفورت (Europe - Frankfurt)' },
                    { value: 'أي سيرفر مناسب', label: 'أي سيرفر باتفاق الكباتن' },
                  ]}
                />

                <CustomSelect
                  label="المستوى المطلوب للخصم:"
                  value={minRank}
                  onChange={setMinRank}
                  options={[
                    { value: 'مفتوح لجميع الرتب', label: 'مفتوح لجميع المستويات' },
                    { value: 'Radiant / Immortal / Faceit 10', label: 'نخبة ومحترفين (High Tier)' },
                    { value: 'Diamond / Ascendant+', label: 'متوسط إلى عالي (Mid-High Tier)' },
                    { value: 'Gold / Platinum', label: 'مستوى متوسط (Mid Tier)' },
                  ]}
                />
              </div>

              {/* Timing */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">موعد بدء السكريم:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTimingType('now')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black border transition ${
 timingType === 'now'
 ? 'bg-white text-black border-white shadow-md font-black'
 : 'bg-[#141414] border-white/10 text-zinc-300 hover:text-white'
 }`}
                  >
                    الآن فوراً (Live)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimingType('tonight')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black border transition ${
 timingType === 'tonight'
 ? 'bg-white text-black border-white shadow-md'
 : 'bg-[#141414] border-white/10 text-zinc-300 hover:text-white'
 }`}
                  >
                    الليلة (خلال ساعتين)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimingType('custom')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black border transition ${
 timingType === 'custom'
 ? 'bg-white text-black border-white shadow-md'
 : 'bg-[#141414] border-white/10 text-zinc-300 hover:text-white'
 }`}
                  >
                    وقت مخصص
                  </button>
                </div>
              </div>

              {/* Discord / Extra Notes */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">شروط أو ملاحظات إضافية للكابتن المنافس (اختياري):</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: جاهزين 5 أساسيين، ديسكورد إلزامي، اللعب بدون توقف"
                  className="w-full text-xs p-3 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={onClose}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  disabled={!selectedTeamId}
                  icon={<Swords className="w-4 h-4" />}
                  className="font-extrabold"
                >
                  نشر غرفة التحدي في الساحة
                </Button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
}
