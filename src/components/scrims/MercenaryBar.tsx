'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Check, 
  Clock, 
  Gamepad2, 
  ShieldAlert, 
  MessageSquare, 
  Flame, 
  Loader2, 
  Sparkles 
} from 'lucide-react';
import { ScrimMercenary, Profile } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { GameSearchInput } from '@/components/GameSearchInput';

import { useSwrData } from '@/lib/cache';
import { Button, Badge, Card } from '@/components/ui';

interface MercenaryBarProps {
  currentUser: Profile | null;
}

export function MercenaryBar({ currentUser }: MercenaryBarProps) {
  const { data: mercenaries = [], revalidate: revalidateMercenaries } = useSwrData<ScrimMercenary[]>(
    'scrim_mercenaries_list',
    async () => {
      const { data } = await supabase
        .from('scrim_mercenaries')
        .select(`
          *,
          user:profiles!scrim_mercenaries_user_id_fkey(*)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(20);
      return (data || []) as ScrimMercenary[];
    },
    { ttl: 120_000 }
  );

  const isMyStatusActive = Boolean(currentUser && mercenaries.some((m) => m.user_id === currentUser.id));
  const [myGame, setMyGame] = useState('Valorant');
  const [myRole, setMyRole] = useState('Duelist / Entry');
  const [myRank, setMyRank] = useState('Ascendant / Immortal');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('mercenaries_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scrim_mercenaries' },
        () => {
          revalidateMercenaries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [revalidateMercenaries]);

  const handleToggleMyStatus = async () => {
    if (!currentUser) return;
    setIsLoading(true);

    try {
      if (isMyStatusActive) {
        // Delete my status
        await supabase
          .from('scrim_mercenaries')
          .delete()
          .eq('user_id', currentUser.id);

        setIsFormOpen(false);
      } else {
        // Create my status
        await supabase
          .from('scrim_mercenaries')
          .upsert({
            user_id: currentUser.id,
            game: myGame,
            role: myRole,
            rank: myRank,
            is_available: true,
            expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          });

        setIsFormOpen(false);
      }
      await revalidateMercenaries();
    } catch (err) {
      console.error('Error updating mercenary status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="elevated" className="p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
              <span>سوق البدلاء واللاعبين الأحرار للسكريمات</span>
              <Badge variant="default" size="xs">
                <span>{mercenaries.length} متاح للعب</span>
              </Badge>
            </h4>
            <p className="text-[11px] text-zinc-400">
              ناقصكم لاعب للسكريم الليلة؟ تصفح اللاعبين المتاحين حالياً أو أعلن جاهزيتك كبديل
            </p>
          </div>
        </div>

        {currentUser && (
          <Button
            variant={isMyStatusActive ? "secondary" : "primary"}
            size="sm"
            isLoading={isLoading}
            icon={isMyStatusActive ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <UserPlus className="w-3.5 h-3.5" />}
            onClick={() => {
              if (isMyStatusActive) {
                handleToggleMyStatus();
              } else {
                setIsFormOpen(!isFormOpen);
              }
            }}
          >
            <span>{isMyStatusActive ? 'أنت مسجل كبديل متاح (إلغاء)' : 'تسجيل نفسي كبديل جاهز للعب'}</span>
          </Button>
        )}
      </div>

      {/* Form when opening toggle */}
      {isFormOpen && !isMyStatusActive && (
        <div className="p-4 rounded-2xl bg-[#121212] border border-white/10 space-y-3 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <GameSearchInput
              label="اللعبة التي تجيدها:"
              value={myGame}
              onChange={setMyGame}
              placeholder="اختر اللعبة..."
            />
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">الرتبة / المستوى:</label>
              <input
                type="text"
                value={myRank}
                onChange={(e) => setMyRank(e.target.value)}
                placeholder="مثال: Radiant / Immortal / Faceit 10"
                className="w-full text-xs p-2.5 rounded-xl input-3d text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">الدور الأساسي (Role):</label>
              <input
                type="text"
                value={myRole}
                onChange={(e) => setMyRole(e.target.value)}
                placeholder="مثال: Duelist, Entry, Striker"
                className="w-full text-xs p-2.5 rounded-xl input-3d text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFormOpen(false)}
            >
              <span>إلغاء</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isLoading}
              onClick={handleToggleMyStatus}
            >
              <span>تأكيد الجاهزية والنشر</span>
            </Button>
          </div>
        </div>
      )}

      {/* Mercenaries Grid */}
      {mercenaries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {mercenaries.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-2xl bg-[#121212] border border-white/10 flex items-center justify-between gap-3 hover:border-white/25 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={m.user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={m.user?.username || 'Player'}
                  className="w-9 h-9 rounded-xl object-cover border border-white/15 shrink-0"
                />
                <div className="truncate">
                  <div className="text-xs font-black text-white truncate">
                    {m.user?.full_name || m.user?.username}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    {m.game} {m.role ? `• ${m.role}` : ''}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {m.rank && (
                  <Badge variant="default" size="xs">
                    <span>{m.rank}</span>
                  </Badge>
                )}
                {m.user?.city && (
                  <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5 rounded bg-black">
                    {m.user.city}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-xs text-zinc-500 rounded-xl bg-black/40 border border-white/5">
          لا يوجد لاعبين مسجلين كبدلاء حالياً. كن أول من يسجل جاهزيته!
        </div>
      )}
    </Card>
  );
}
