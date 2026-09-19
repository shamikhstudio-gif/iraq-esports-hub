'use client';

import React, { useState } from 'react';
import { 
  Bug, 
  Lightbulb, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  Monitor, 
  Trash2, 
  Check, 
  Filter,
  MessageSquare,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { BetaFeedback } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { Badge, Button, Card } from '@/components/ui';

interface BetaFeedbackTabProps {
  feedbackList: BetaFeedback[];
  onRefresh: () => void;
}

export function BetaFeedbackTab({ feedbackList, onRefresh }: BetaFeedbackTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, newStatus: BetaFeedback['status']) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('beta_feedback')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Failed to update feedback status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقرير نهائياً؟')) return;
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('beta_feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onRefresh();
    } catch (err) {
      console.error('Failed to delete feedback:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredList = feedbackList.filter((item) => {
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchType = typeFilter === 'all' || item.type === typeFilter;
    return matchStatus && matchType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-3.5 h-3.5 text-white" />;
      case 'suggestion':
        return <Lightbulb className="w-3.5 h-3.5 text-white" />;
      case 'scrims':
        return <Zap className="w-3.5 h-3.5 text-white" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-white" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bug':
        return 'خطأ برمجي (Bug)';
      case 'suggestion':
        return 'اقتراح (Idea)';
      case 'scrims':
        return 'أداء وسكريمات';
      default:
        return 'أخرى';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="solid" size="xs">جديد</Badge>;
      case 'in_progress':
        return <Badge variant="outline" size="xs">قيد المعالجة</Badge>;
      case 'resolved':
        return <Badge variant="default" size="xs">تم الحل ✓</Badge>;
      case 'closed':
        return <Badge variant="outline" size="xs">مغلق</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="card-3d p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-zinc-400 ml-2">الحالة:</span>
          {['all', 'new', 'in_progress', 'resolved', 'closed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-white text-black'
                  : 'bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {st === 'all' && `الكل (${feedbackList.length})`}
              {st === 'new' && `جديد (${feedbackList.filter((f) => f.status === 'new').length})`}
              {st === 'in_progress' && `قيد المعالجة (${feedbackList.filter((f) => f.status === 'in_progress').length})`}
              {st === 'resolved' && `تم الحل (${feedbackList.filter((f) => f.status === 'resolved').length})`}
              {st === 'closed' && 'مغلق'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-zinc-400 ml-2">النوع:</span>
          {['all', 'bug', 'suggestion'].map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => setTypeFilter(tp)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                typeFilter === tp
                  ? 'bg-white text-black'
                  : 'bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {tp === 'all' && 'جميع الأنواع'}
              {tp === 'bug' && 'أخطاء'}
              {tp === 'suggestion' && 'اقتراحات'}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback cards */}
      {filteredList.length === 0 ? (
        <Card variant="glass" className="p-12 text-center text-zinc-500">
          <CheckCircle2 className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
          <h3 className="font-bold text-sm text-zinc-300">لا توجد تقارير في هذا التصنيف</h3>
          <p className="text-xs text-zinc-500 mt-1">جميع التقارير والملاحظات التي يرسلها مختبرو البيتا ستظهر هنا مباشرة.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => (
            <div 
              key={item.id}
              className={`card-3d p-4 sm:p-5 transition space-y-3 ${
                item.status === 'new' ? 'border-white/25 bg-[#121212]' : 'border-white/10'
              }`}
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/15">
                    {getTypeIcon(item.type)}
                  </div>
                  <span className="text-xs font-bold text-zinc-300">
                    {getTypeLabel(item.type)}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-500 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(item.created_at).toLocaleString('ar-IQ')}</span>
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed bg-black/50 p-3.5 rounded-xl border border-white/10 font-medium">
                  {item.description}
                </p>
              </div>

              {/* Device & User Info metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] font-mono bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05]">
                <div className="flex items-center gap-1.5 text-zinc-400 truncate">
                  {item.device_info?.platform?.includes('Mobile') ? (
                    <Smartphone className="w-3.5 h-3.5 text-white shrink-0" />
                  ) : (
                    <Monitor className="w-3.5 h-3.5 text-white shrink-0" />
                  )}
                  <span className="truncate">{item.device_info?.platform || 'غير محدد'} ({item.device_info?.screen || 'N/A'})</span>
                </div>

                <div className="text-zinc-400 truncate">
                  <span className="text-zinc-600 ml-1">المسار:</span>
                  <span className="text-white">{item.device_info?.route || '/'}</span>
                </div>

                {item.device_info?.contact && (
                  <div className="text-zinc-400 truncate">
                    <span className="text-zinc-600 ml-1">تواصل:</span>
                    <span className="text-white font-bold">{item.device_info.contact}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  {item.status !== 'in_progress' && (
                    <Button
                      variant="outline"
                      size="xs"
                      disabled={updatingId === item.id}
                      onClick={() => handleUpdateStatus(item.id, 'in_progress')}
                    >
                      وضع قيد المعالجة
                    </Button>
                  )}
                  {item.status !== 'resolved' && (
                    <Button
                      variant="primary"
                      size="xs"
                      disabled={updatingId === item.id}
                      onClick={() => handleUpdateStatus(item.id, 'resolved')}
                    >
                      تعليم كـ تم الحل ✓
                    </Button>
                  )}
                  {item.status !== 'closed' && item.status !== 'new' && (
                    <Button
                      variant="ghost"
                      size="xs"
                      disabled={updatingId === item.id}
                      onClick={() => handleUpdateStatus(item.id, 'closed')}
                    >
                      إغلاق
                    </Button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="xs"
                  disabled={updatingId === item.id}
                  onClick={() => handleDelete(item.id)}
                  className="text-zinc-500 hover:text-white"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
