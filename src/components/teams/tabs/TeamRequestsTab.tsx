'use client';

import React from 'react';
import { UserPlus, Check } from 'lucide-react';
import { TeamJoinRequest } from '@/lib/types';
import { Button, Badge, Card } from '@/components/ui';

interface TeamRequestsTabProps {
  requests: TeamJoinRequest[];
  handleAcceptRequest: (req: TeamJoinRequest) => void;
  handleRejectRequest: (reqId: string) => void;
  isLoading: boolean;
}

export function TeamRequestsTab({
  requests,
  handleAcceptRequest,
  handleRejectRequest,
  isLoading,
}: TeamRequestsTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs sm:text-sm font-extrabold text-white">
          طلبات الانضمام وتجارب الأداء المعلقة ({requests.length})
        </h3>
        <p className="text-[11px] text-zinc-400">
          راجع رتب وإحصائيات اللاعبين المتقدمين للانضمام وقرر قبولهم أو رفضهم
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="p-10 text-center rounded-2xl border border-dashed border-white/10 bg-[#080808]">
          <UserPlus className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs text-zinc-400 font-bold">لا توجد طلبات انضمام جديدة حالياً</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card
              key={req.id}
              variant="elevated"
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <img
                  src={req.user?.avatar_url || 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=100'}
                  alt={req.user?.full_name || ''}
                  className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0 shadow-sm"
                />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{req.user?.full_name}</span>
                    <span className="text-[11px] text-zinc-400">@{req.user?.username}</span>
                    <Badge variant="default" size="xs">
                      {req.game || 'لعبة تنافسية'}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                    <span>الـ ID داخل اللعبة: <strong className="text-white font-mono">{req.in_game_id}</strong></span>
                    <span>•</span>
                    <span>الرتبة: <strong className="text-white">{req.rank}</strong></span>
                  </div>
                  {req.message && (
                    <p className="text-xs text-zinc-300 bg-[#080808] p-2.5 rounded-xl border border-white/10 mt-2 leading-relaxed">
                      &quot;{req.message}&quot;
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Check className="w-4 h-4" />}
                  isLoading={isLoading}
                  onClick={() => handleAcceptRequest(req)}
                >
                  <span>قبول في التشكيلة</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  isLoading={isLoading}
                  onClick={() => handleRejectRequest(req.id)}
                >
                  <span>رفض</span>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
