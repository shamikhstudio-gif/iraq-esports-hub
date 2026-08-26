'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, X } from 'lucide-react';
import { NotificationItem } from '@/lib/types';
import Link from 'next/link';

export function RealtimeToaster() {
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Basic polling or local storage check to get the current user ID globally
    const checkUser = () => {
      const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('babylon_user_id') : null;
      if (savedUserId !== userId) {
        setUserId(savedUserId);
      }
    };
    checkUser();
    const interval = setInterval(checkUser, 2000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('public:notifications_toast')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newNotif = payload.new as NotificationItem;
          setToasts((prev) => [...prev, newNotif]);
          
          // Auto remove after 5 seconds
          setTimeout(() => {
            setToasts((current) => current.filter((t) => t.id !== newNotif.id));
          }, 6000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-[999999] flex flex-col gap-3 max-w-sm w-[calc(100vw-2rem)] sm:w-full pointer-events-none" dir="rtl">
      {toasts.map((toast) => (
        <div 
          key={toast.id} 
          className="bg-[#121212] border border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.9)] rounded-2xl p-4 pointer-events-auto flex gap-3 items-start animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center shrink-0 shadow-inner">
            <Bell className="w-5 h-5 fill-black" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-white leading-tight">{toast.title}</h4>
            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{toast.description}</p>
            {toast.link_url && (
              <Link 
                href={toast.link_url}
                className="inline-flex mt-2.5 text-[11px] font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
                onClick={() => {
                  setToasts((current) => current.filter((t) => t.id !== toast.id));
                }}
              >
                عرض التفاصيل والتفاعل
              </Link>
            )}
          </div>
          <button 
            onClick={() => setToasts((current) => current.filter((t) => t.id !== toast.id))}
            className="text-zinc-500 hover:text-white transition p-1 bg-white/5 rounded-lg hover:bg-white/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
