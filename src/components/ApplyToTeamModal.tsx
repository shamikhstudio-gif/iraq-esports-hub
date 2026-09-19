'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  UserPlus, 
  Shield, 
  Lock, 
  Check, 
  AlertCircle, 
  Loader2, 
  Gamepad2, 
  Trophy, 
  Sparkles 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Team, Profile } from '@/lib/types';
import { CustomSelect } from './CustomSelect';
import { Button } from '@/components/ui';

interface ApplyToTeamModalProps {
  team: Team;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApplyToTeamModal({
  team,
  isOpen,
  onClose,
  onSuccess,
}: ApplyToTeamModalProps) {
  const [selectedGame, setSelectedGame] = useState(team.games?.[0] || 'Valorant');
  const [inGameId, setInGameId] = useState('');
  const [rank, setRank] = useState('');
  const [message, setMessage] = useState('');
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadCurrentUser();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const loadCurrentUser = async () => {
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedUserId) {
      setCurrentUser(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', savedUserId).single();
    if (data) {
      setCurrentUser(data as Profile);
      setInGameId(data.in_game_id || '');
      if (data.primary_game) setSelectedGame(data.primary_game);
    }
  };

  if (!mounted || !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!currentUser && !savedUserId) {
      setErrorMsg('يجب تسجيل الدخول للتقديم على الانضمام للفريق');
      return;
    }

    if (!inGameId.trim()) {
      setErrorMsg('يرجى كتابة الـ ID أو اسمك داخل اللعبة (In-Game Name/ID)');
      return;
    }

    if (!rank.trim()) {
      setErrorMsg('يرجى تحديد رتبتك الحالية في اللعبة');
      return;
    }

    if (team.is_exclusive && !agreedToRules) {
      setErrorMsg('يجب الموافقة على شروط وقوانين الفريق وبند الحصرية قبل التقديم');
      return;
    }

    setIsLoading(true);
    try {
      const userId = currentUser?.id || savedUserId!;

      // Check if user already in a team and team is exclusive
      if (currentUser?.team_id) {
        if (currentUser.team_id === team.id) {
          throw new Error('أنت عضو بالفعل في هذا الفريق!');
        }
        if (team.is_exclusive) {
          throw new Error('لا يمكنك الانضمام لأنك مسجل حالياً كعضو في فريق آخر، وهذا الفريق يشترط التفرغ والحصرية. يرجى مغادرة فريقك الحالي أولاً.');
        }
      }

      // Check if pending request already exists
      const { data: existing } = await supabase
        .from('team_join_requests')
        .select('id')
        .eq('team_id', team.id)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .maybeSingle();

      if (existing) {
        throw new Error('لديك طلب انضمام قيد المراجعة بالفعل لهذا الفريق.');
      }

      // Insert join request
      const { error: insertError } = await supabase
        .from('team_join_requests')
        .insert({
          team_id: team.id,
          user_id: userId,
          game: selectedGame,
          in_game_id: inGameId.trim(),
          rank: rank.trim(),
          message: message.trim(),
          status: 'pending',
        });

      if (insertError) throw insertError;

      // Notify team captain if captain_id exists (use 'message' column in notifications)
      if (team.captain_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: team.captain_id,
            type: 'team_invite',
            title: `طلب انضمام جديد لفريق ${team.name}!`,
            message: `تقدم اللاعب ${currentUser?.full_name || currentUser?.username || 'لاعب'} بطلب انضمام وتجربة أداء (رتبة: ${rank}).`,
            link_url: `/teams/${team.id}`,
            is_read: false,
          });
        } catch (notifErr) {
          console.warn('Could not send notification to captain:', notifErr);
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error submitting team join request:', err);
      setErrorMsg(err.message || 'حدث خطأ أثناء تقديم الطلب');
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
        className="w-full max-w-lg max-h-[85vh] modal-animate rounded-3xl flex flex-col overflow-hidden text-right text-white"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#121212] text-white flex items-center justify-between border-b border-white/10 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#080808] p-1 border border-white/15 overflow-hidden flex items-center justify-center shadow-inner">
              <img
                src={team.logo_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                alt={team.name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
                <span>طلب تجربة أداء وانضمام لـ</span>
                <span className="text-white underline">{team.name}</span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                سيتم إرسال بياناتك وإحصائياتك مباشرة إلى كابتن وإدارة الفريق
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-2 shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-white" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Exclusivity Notice */}
          {team.is_exclusive && (
            <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/20 text-xs text-zinc-200 space-y-1 shadow-sm">
              <div className="flex items-center gap-1.5 font-black text-white">
                <Lock className="w-4 h-4 text-white shrink-0" />
                <span>تنبيه: هذا الفريق يطبق قانون العضوية الحصرية</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                الانضمام لـ [{team.tag}] يعني التزامك الكامل باللعب باسم هذا الفريق فقط في البطولات الرسمية والسكريمات.
              </p>
            </div>
          )}

          {/* Game Selection */}
          <CustomSelect
            label="اللعبة التي ترغب بالانضمام لتشكيلتها:"
            value={selectedGame}
            onChange={setSelectedGame}
            options={(team.games && team.games.length > 0 ? team.games : ['Valorant', 'PUBG Mobile', 'Counter-Strike 2']).map((g) => ({
              value: g,
              label: g,
            }))}
          />

          {/* In-Game ID & Rank */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                الـ ID / الاسم داخل اللعبة:
              </label>
              <input
                type="text"
                value={inGameId}
                onChange={(e) => setInGameId(e.target.value)}
                placeholder="مثال: Ghost#9999"
                required
                className="w-full text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                الرتبة الحالية (Current Rank):
              </label>
              <input
                type="text"
                value={rank}
                onChange={(e) => setRank(e.target.value)}
                placeholder="مثال: Immortal 2 / Conqueror"
                required
                className="w-full text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Message / Bio */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5">
              رسالة للكابتن / نبذة عن خبرتك وأوقات فراغك:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="مثال: ألعب مركز Entry Fragger متفرغ يومياً من الساعة 7 مساءً، ولدي خبرة في بطولات سابقة..."
              className="w-full text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Agreement Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#080808] border border-white/10 shadow-inner cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToRules}
              onChange={(e) => setAgreedToRules(e.target.checked)}
              className="w-4 h-4 text-black rounded mt-0.5 bg-black border-white/20 accent-white"
            />
            <span className="text-xs text-zinc-300 font-medium leading-relaxed">
              أتعهد بالالتزام بجميع قوانين فريق {team.name} وأوقات التمارين والسكريمات واللعب النظيف.
            </span>
          </label>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-2">
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
              icon={<UserPlus className="w-4 h-4" />}
              className="font-extrabold"
            >
              إرسال طلب الانضمام
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
