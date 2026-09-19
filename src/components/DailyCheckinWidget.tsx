'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CalendarCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { Card, Button, Badge } from '@/components/ui';
import { triggerHaptic } from '@/lib/haptics';

export function DailyCheckinWidget() {
  const { user: profile, updateUser } = useUser();
  const [isClaiming, setIsClaiming] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<number>(50);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Fetch dynamic reward amount configured in platform_settings (default 50)
  useEffect(() => {
    let isMounted = true;
    async function fetchDailyConfig() {
      try {
        const { data } = await supabase
          .from('platform_settings')
          .select('value')
          .eq('key', 'daily_rewards_config')
          .maybeSingle();

        if (isMounted && data?.value && typeof data.value.daily_ebits === 'number') {
          setRewardAmount(data.value.daily_ebits);
        }
      } catch (err) {
        console.warn('Failed to fetch daily reward amount:', err);
      }
    }

    fetchDailyConfig();

    const handleFeedRefresh = () => {
      fetchDailyConfig();
    };
    window.addEventListener('ieh:refresh-feed', handleFeedRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener('ieh:refresh-feed', handleFeedRefresh);
    };
  }, []);

  if (!profile) return null;

  const today = new Date().toISOString().split('T')[0];
  const lastCheckin = profile.last_checkin_date 
    ? new Date(profile.last_checkin_date).toISOString().split('T')[0] 
    : null;
  const canClaim = lastCheckin !== today;

  const handleClaim = async () => {
    if (!profile || isClaiming) return;
    setIsClaiming(true);
    setFeedback(null);

    try {
      const { data, error } = await supabase.rpc('claim_daily_checkin', {
        p_user_id: profile.id,
      });

      if (error) {
        setFeedback({ type: 'error', text: error.message || 'حدث خطأ أثناء المطالبة بالمكافأة' });
        return;
      }

      if (data && data.success) {
        triggerHaptic('success');
        const awarded = typeof data.reward_amount === 'number' ? data.reward_amount : rewardAmount;
        updateUser({
          ebits_balance: data.ebits_balance,
          last_checkin_date: new Date().toISOString(),
        });
        setFeedback({ 
          type: 'success', 
          text: data.message || `+${awarded} eBits تمت إضافتها بنجاح!` 
        });
      } else if (data && !data.success) {
        updateUser({
          last_checkin_date: new Date().toISOString(),
        });
        setFeedback({ type: 'info', text: data.message || 'لقد استلمت مكافأة اليوم بالفعل' });
      }
    } catch (err: unknown) {
      console.error('Error claiming reward:', err);
      const msg = err instanceof Error ? err.message : 'تعذر الاتصال بالسيرفر للمطالبة بالمكافأة';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsClaiming(false);
      setTimeout(() => {
        setFeedback(null);
      }, 5000);
    }
  };

  const currentEbits = profile.ebits_balance || 0;

  return (
    <Card variant="glass" className="p-4 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center shrink-0">
            <CalendarCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-black text-xs text-white">مكافأة الدخول اليومي</h4>
              <span className="text-[10px] text-zinc-300 font-mono font-bold px-2 py-0.5 rounded bg-white/10 border border-white/15">
                رصيدك: {currentEbits.toLocaleString()} eBits
              </span>
              {feedback && (
                <Badge
                  variant={feedback.type === 'success' ? 'solid' : 'outline'}
                  size="xs"
                  className="animate-in fade-in zoom-in duration-200"
                >
                  {feedback.text}
                </Badge>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              سجل الدخول يومياً واكسب {rewardAmount} eBits مجاناً للتخصيص والبطولات
            </p>
          </div>
        </div>

        <Button
          onClick={handleClaim}
          disabled={!canClaim || isClaiming}
          isLoading={isClaiming}
          variant={canClaim ? 'primary' : 'secondary'}
          size="sm"
          className="w-full sm:w-auto shrink-0 font-black"
          icon={!canClaim ? <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" /> : <Sparkles className="w-3.5 h-3.5 text-black" />}
        >
          <span>{canClaim ? `مكافأة الدخول (+${rewardAmount} eBits)` : 'تمت المطالبة اليوم'}</span>
        </Button>
      </div>
    </Card>
  );
}
