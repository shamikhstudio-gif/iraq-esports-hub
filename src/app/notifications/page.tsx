'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCheck, 
  Send
} from 'lucide-react';
import { BellIcon } from '@/components/icons/CustomIcons';
import { supabase } from '@/lib/supabase';
import { NotificationItem } from '@/lib/types';
import { SuspensionModal } from '@/components/SuspensionModal';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'admin' | 'followers'>('all');
  const [selectedSuspensionNotice, setSelectedSuspensionNotice] = useState<NotificationItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsLoading(true);
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedUserId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    const { data } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(*)
      `)
      .eq('user_id', savedUserId)
      .order('created_at', { ascending: false });

    if (data) {
      setNotifications(data as NotificationItem[]);
    }
    setIsLoading(false);
  };

  const handleMarkAllAsRead = async () => {
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
    if (!savedUserId) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', savedUserId);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
    }

    if (notif.type === 'account_suspended') {
      setSelectedSuspensionNotice(notif);
      setIsModalOpen(true);
    } else if (notif.link_url) {
      router.push(notif.link_url);
    }
  };

  const handleSupportDispatched = (notifId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, support_dispatched: true } : n))
    );
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'admin') return n.type === 'first_warning' || n.type === 'account_suspended';
    if (filter === 'followers') return n.type === 'new_follower';
    return true;
  });

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'new_follower':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#181818] border border-white/20 flex items-center justify-center text-white shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
        );
      case 'first_warning':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#181818] border border-white/20 flex items-center justify-center text-white shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        );
      case 'account_suspended':
        return (
          <div className="w-10 h-10 rounded-xl bg-[#181818] border border-white/40 flex items-center justify-center text-white shrink-0 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-[#181818] border border-white/15 flex items-center justify-center text-zinc-400 shrink-0">
            <BellIcon className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#181818] border border-white/20 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <BellIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              مركز الإشعارات الموحد
            </h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              متابعة تنبيهات الحساب، الإنذارات الإدارية، وإشعارات المتابعين
            </p>
          </div>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          className="flex items-center gap-1.5 px-3.5 py-2 btn-3d-dark text-white rounded-xl text-xs font-semibold transition"
        >
          <CheckCheck className="w-4 h-4 text-white" />
          <span>تحديد الكل كمقروء</span>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            filter === 'all'
              ? 'bg-white text-black shadow-sm'
              : 'bg-[#080808] text-zinc-400 hover:bg-white/5 hover:text-white border border-white/10'
          }`}
        >
          جميع الإشعارات ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('admin')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            filter === 'admin'
              ? 'bg-white text-black shadow-sm'
              : 'bg-[#080808] text-zinc-400 hover:bg-white/5 hover:text-white border border-white/10'
          }`}
        >
          التنبيهات الإدارية
        </button>
        <button
          onClick={() => setFilter('followers')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
            filter === 'followers'
              ? 'bg-white text-black shadow-sm'
              : 'bg-[#080808] text-zinc-400 hover:bg-white/5 hover:text-white border border-white/10'
          }`}
        >
          المتابعون الجدد
        </button>
      </div>

      {isLoading ? (
        <div className="card-3d p-12 text-center text-zinc-400 text-sm font-medium">
          جاري تحميل الإشعارات...
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="card-3d p-12 text-center text-zinc-400">
          <BellIcon className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
          <h3 className="font-bold text-sm text-zinc-200">لا توجد إشعارات حالياً</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const isSuspended = notif.type === 'account_suspended';
            const isWarning = notif.type === 'first_warning';
            const isFollower = notif.type === 'new_follower';

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`card-3d p-4 sm:p-5 transition cursor-pointer relative overflow-hidden ${
                  !notif.is_read ? 'border-white/40 shadow-[0_12px_30px_rgba(255,255,255,0.05)]' : ''
                } ${isSuspended ? 'border-white/50' : ''}`}
              >
                {!notif.is_read && (
                  <span className="absolute top-4 left-4 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
                )}

                <div className="flex items-start gap-4">
                  {renderIcon(notif.type)}

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-sm text-white">
                          {notif.title}
                        </h4>
                        {isSuspended && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-white text-black shadow-xs">
                            تفاعلي - انقر للتفاصيل والاستئناف
                          </span>
                        )}
                        {isWarning && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/10 text-white border border-white/20">
                            إنذار إداري
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] text-zinc-400 font-medium font-mono">
                        {new Date(notif.created_at).toLocaleDateString('ar-IQ', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                      {notif.description}
                    </p>

                    {isSuspended && (
                      <div className="mt-3 p-3 rounded-2xl bg-[#080808] border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-inner">
                        <div className="text-white font-bold">
                          تم تعليق حسابك لمدة {notif.suspension_days || 7} أيام لسبب ({notif.suspension_reason || 'مخالفة السلوك التنافسي'}).
                        </div>
                        <button
                          type="button"
                          className="px-3.5 py-1.5 btn-3d-primary text-black rounded-xl font-extrabold text-xs shrink-0 flex items-center justify-center gap-1 transition"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>فتح نافذة الاستئناف والتواصل مع الدعم</span>
                        </button>
                      </div>
                    )}

                    {isFollower && notif.actor && (
                      <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-zinc-400">
                        <span>اللاعب: @{notif.actor.username}</span>
                        <span>•</span>
                        <span>اللعبة: {notif.actor.primary_game}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SuspensionModal
        notification={selectedSuspensionNotice}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSupportDispatched={handleSupportDispatched}
      />
    </div>
  );
}