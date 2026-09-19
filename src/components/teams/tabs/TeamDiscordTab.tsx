'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ExternalLink, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Swords, 
  Trophy, 
  Bell, 
  MessageSquare, 
  UserPlus, 
  Sparkles,
  HelpCircle,
  Play
} from 'lucide-react';
import { Team, DiscordWebhookChannel } from '@/lib/types';
import { Modal, Input, Button, Badge, Card } from '@/components/ui';

interface TeamDiscordTabProps {
  team: Team;
  onSaveWebhooks: (webhooks: DiscordWebhookChannel[]) => Promise<void>;
  isLoading?: boolean;
}

const DEFAULT_EVENTS: DiscordWebhookChannel['events'] = {
  scrim_created: true,
  match_completed: true,
  war_room_alert: true,
  team_posts: true,
  roster_updates: true,
};

export function TeamDiscordTab({
  team,
  onSaveWebhooks,
  isLoading = false,
}: TeamDiscordTabProps) {
  const [webhooks, setWebhooks] = useState<DiscordWebhookChannel[]>(team.discord_webhooks || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formMention, setFormMention] = useState('@member');
  const [formEvents, setFormEvents] = useState<DiscordWebhookChannel['events']>(DEFAULT_EVENTS);
  const [formError, setFormError] = useState('');

  // Testing status
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testNotice, setTestNotice] = useState<{ id: string; success: boolean; msg: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const openAddModal = () => {
    setEditingId(null);
    setFormName('');
    setFormUrl('');
    setFormMention('@member');
    setFormEvents({ ...DEFAULT_EVENTS });
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (channel: DiscordWebhookChannel) => {
    setEditingId(channel.id);
    setFormName(channel.name);
    setFormUrl(channel.webhook_url);
    setFormMention(channel.mention || '');
    setFormEvents({ ...channel.events });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveChannel = () => {
    if (!formName.trim()) {
      setFormError('يرجى كتابة اسم القناة (مثال: #نتائج-المباريات)');
      return;
    }

    if (!formUrl.trim() || !formUrl.startsWith('https://discord.com/api/webhooks/')) {
      setFormError('رابط Webhook غير صالح. يجب أن يبدأ بـ https://discord.com/api/webhooks/');
      return;
    }

    if (editingId) {
      setWebhooks((prev) =>
        prev.map((ch) =>
          ch.id === editingId
            ? {
                ...ch,
                name: formName.trim(),
                webhook_url: formUrl.trim(),
                mention: formMention.trim() || undefined,
                events: { ...formEvents },
              }
            : ch
        )
      );
    } else {
      const newChannel: DiscordWebhookChannel = {
        id: crypto.randomUUID(),
        name: formName.trim(),
        webhook_url: formUrl.trim(),
        mention: formMention.trim() || undefined,
        is_enabled: true,
        events: { ...formEvents },
        created_at: new Date().toISOString(),
      };
      setWebhooks((prev) => [...prev, newChannel]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteChannel = (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه القناة؟')) return;
    setWebhooks((prev) => prev.filter((ch) => ch.id !== id));
  };

  const handleToggleChannel = (id: string) => {
    setWebhooks((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, is_enabled: !ch.is_enabled } : ch))
    );
  };

  const handleTestChannel = async (channel: DiscordWebhookChannel) => {
    setTestingId(channel.id);
    setTestNotice(null);

    try {
      const res = await fetch('/api/teams/discord-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          webhookUrl: channel.webhook_url,
          channelName: channel.name,
          mention: channel.mention,
          team,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestNotice({ id: channel.id, success: true, msg: data.message || 'تم إرسال الرسالة التجريبية بنجاح!' });
      } else {
        setTestNotice({ id: channel.id, success: false, msg: data.error || 'فشل إرسال الرسالة إلى ديسكورد' });
      }
    } catch (err: any) {
      setTestNotice({ id: channel.id, success: false, msg: err.message || 'حدث خطأ في الاتصال' });
    } finally {
      setTestingId(null);
      setTimeout(() => setTestNotice(null), 5000);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSaveWebhooks(webhooks);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving webhooks:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const applyPreset3Channels = () => {
    if (webhooks.length > 0 && !confirm('سيتم استبدال القنوات الحالية بالإعداد الاحترافي المقسم. هل تريد المتابعة؟')) return;
    setWebhooks([
      {
        id: crypto.randomUUID(),
        name: '#scrims-lfg (تحديات السكريمات)',
        webhook_url: '',
        mention: '@here',
        is_enabled: true,
        events: {
          scrim_created: true,
          war_room_alert: true,
          match_completed: false,
          team_posts: false,
          roster_updates: false,
        },
      },
      {
        id: crypto.randomUUID(),
        name: '#match-results (نتائج المباريات والإثباتات)',
        webhook_url: '',
        mention: '@everyone',
        is_enabled: true,
        events: {
          scrim_created: false,
          war_room_alert: false,
          match_completed: true,
          team_posts: false,
          roster_updates: false,
        },
      },
      {
        id: crypto.randomUUID(),
        name: '#announcements (إعلانات وانتقالات الفريق)',
        webhook_url: '',
        mention: '@member',
        is_enabled: true,
        events: {
          scrim_created: false,
          war_room_alert: false,
          match_completed: false,
          team_posts: true,
          roster_updates: true,
        },
      },
    ]);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Banner Header */}
      <Card variant="elevated" className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="default" size="xs" icon={<Radio className="w-3.5 h-3.5 text-white" />}>
              <span>DISCORD MATRIX // مصفوفة النشر التلقائي</span>
            </Badge>
          </div>
          <h3 className="text-base font-black text-white">
            ربط قنوات سيرفر الديسكورد والنشر التلقائي للفعاليات
          </h3>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            خصص قنوات الديسكورد لاستقبال إعلانات السكريمات، بطاقات الفوز المعتمدة، نداءات غرفة المباراة، وانتقالات اللاعبين تلقائياً مع منشن مخصص.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={<HelpCircle className="w-3.5 h-3.5 text-white" />}
            onClick={() => setShowTutorial(!showTutorial)}
          >
            <span>كيفية الربط؟</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4 stroke-[3]" />}
            onClick={openAddModal}
          >
            <span>إضافة قناة ديسكورد جديدة</span>
          </Button>
        </div>
      </Card>

      {/* Tutorial Box */}
      {showTutorial && (
        <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/20 space-y-3 text-right animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span>كيفية إنشاء Webhook في سيرفر الديسكورد خلال 10 ثوانٍ:</span>
            </h4>
            <Button 
              variant="ghost" 
              size="icon-sm" 
              onClick={() => setShowTutorial(false)} 
              icon={<X className="w-4 h-4" />} 
              aria-label="إغلاق التعليمات"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-300">
            <div className="p-3 rounded-xl bg-black border border-white/10 space-y-1">
              <span className="font-mono text-white font-bold">1. إعدادات القناة</span>
              <p className="text-[11px] text-zinc-400">افتح سيرفر الديسكورد، واضغط على علامة الإعدادات للقناة المطلوبة.</p>
            </div>
            <div className="p-3 rounded-xl bg-black border border-white/10 space-y-1">
              <span className="font-mono text-white font-bold">2. اختيار Integrations</span>
              <p className="text-[11px] text-zinc-400">توجه إلى قائمة Integrations ثم اضغط على Webhooks &gt; New Webhook.</p>
            </div>
            <div className="p-3 rounded-xl bg-black border border-white/10 space-y-1">
              <span className="font-mono text-white font-bold">3. نسخ الرابط</span>
              <p className="text-[11px] text-zinc-400">اضغط على Copy Webhook URL والصق الرابط في القناة المحددة هنا.</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Setup Presets */}
      {webhooks.length === 0 && (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-dashed border-white/20 text-center space-y-3">
          <p className="text-xs font-bold text-zinc-400">
            لا توجد قنوات ديسكورد مربوطة حالياً. يمكنك الإضافة يدوياً أو اختيار قالب جاهز:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5 text-white" />}
              onClick={applyPreset3Channels}
            >
              <span>تطبيق قالب القنوات الاحترافية المقسمة (#scrims, #results, #announcements)</span>
            </Button>
          </div>
        </div>
      )}

      {/* Channels List */}
      <div className="space-y-3">
        {webhooks.map((channel) => {
          const isTesting = testingId === channel.id;
          const notice = testNotice?.id === channel.id ? testNotice : null;

          return (
            <Card
              key={channel.id}
              variant="interactive"
              className={`p-4 sm:p-5 space-y-3 ${!channel.is_enabled ? 'opacity-50' : ''}`}
            >
              {/* Channel Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/15 text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">
                    #
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">{channel.name}</h4>
                      {channel.mention && (
                        <Badge variant="default" size="xs">
                          {channel.mention}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                      {channel.webhook_url ? (
                        <span>{channel.webhook_url.slice(0, 38)}...****</span>
                      ) : (
                        <span className="text-zinc-400 font-sans font-bold">بانتظار لصق رابط الـ Webhook</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Test Button */}
                  <Button
                    variant="secondary"
                    size="xs"
                    icon={isTesting ? undefined : <Play className="w-3 h-3 fill-white text-white" />}
                    isLoading={isTesting}
                    disabled={!channel.webhook_url}
                    onClick={() => handleTestChannel(channel)}
                  >
                    <span>{isTesting ? 'جاري التجربة...' : 'تجربة القناة'}</span>
                  </Button>

                  {/* Edit */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEditModal(channel)}
                    title="تعديل القناة"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>

                  {/* Toggle */}
                  <Button
                    variant={channel.is_enabled ? 'primary' : 'secondary'}
                    size="xs"
                    onClick={() => handleToggleChannel(channel.id)}
                  >
                    <span>{channel.is_enabled ? 'مفعلة' : 'معطلة'}</span>
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDeleteChannel(channel.id)}
                    title="حذف القناة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Notice Banner */}
              {notice && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    notice.success
                      ? 'bg-white text-black font-black'
                      : 'bg-white/10 border border-white/30 text-white'
                  }`}
                >
                  {notice.success ? (
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-white shrink-0" />
                  )}
                  <span>{notice.msg}</span>
                </div>
              )}

              {/* Active Events Tags */}
              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <span className="text-zinc-500 font-bold text-[10px]">الفعاليات الموجهة لهذه القناة:</span>
                {channel.events.scrim_created && (
                  <Badge variant="default" size="xs" icon={<Swords className="w-3 h-3 text-white" />}>
                    <span>تحديات السكريمات</span>
                  </Badge>
                )}
                {channel.events.match_completed && (
                  <Badge variant="default" size="xs" icon={<Trophy className="w-3 h-3 text-white" />}>
                    <span>نتائج المباريات وبطاقات الفوز</span>
                  </Badge>
                )}
                {channel.events.war_room_alert && (
                  <Badge variant="default" size="xs" icon={<Bell className="w-3 h-3 text-white" />}>
                    <span>نداء جاهزية الروم</span>
                  </Badge>
                )}
                {channel.events.team_posts && (
                  <Badge variant="default" size="xs" icon={<MessageSquare className="w-3 h-3 text-white" />}>
                    <span>منشورات وإعلانات الفريق</span>
                  </Badge>
                )}
                {channel.events.roster_updates && (
                  <Badge variant="default" size="xs" icon={<UserPlus className="w-3 h-3 text-white" />}>
                    <span>تعاقدات التشكيلة</span>
                  </Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bottom Save Action Bar */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
        <div>
          {saveSuccess && (
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>تم حفظ وتحديث إعدادات قنوات الديسكورد بنجاح!</span>
            </span>
          )}
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Check className="w-4 h-4 stroke-[3]" />}
          isLoading={isSaving}
          disabled={isLoading}
          onClick={handleSaveAll}
        >
          <span>حفظ كافة قنوات الديسكورد</span>
        </Button>
      </div>

      {/* Standardized Add / Edit Channel Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="md"
        title={editingId ? 'تعديل قناة ديسكورد' : 'إضافة قناة ديسكورد جديدة'}
        subtitle="حدد القناة والرابط لتوجيه الفعاليات التنافسية إليها"
        icon={<Radio className="w-5 h-5 text-white" />}
        accentColor="#ffffff"
        statusNotice={formError ? { type: 'error', message: formError } : null}
        primaryAction={{
          label: editingId ? 'حفظ التعديلات' : 'إضافة القناة',
          onClick: handleSaveChannel,
        }}
        secondaryAction={{
          label: 'إلغاء',
          onClick: () => setIsModalOpen(false),
        }}
      >
        <div className="space-y-4 text-right" dir="rtl">
          {/* Channel Name */}
          <Input
            label="اسم القناة في السيرفر:"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="مثال: #نتائج-المباريات أو #scrims-war-room"
          />

          {/* Webhook URL */}
          <Input
            label="رابط Discord Webhook URL:"
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            isLtr={true}
          />

          {/* Mention Tag */}
          <Input
            label="المنشن المخصص (اختياري):"
            value={formMention}
            onChange={(e) => setFormMention(e.target.value)}
            placeholder="@member أو @everyone أو @here"
            isLtr={true}
            helperText="يمكنك كتابة أي نص منشن مثل @member أو @scrims ليتم تنبيه التشكيلة به، أو اتركه فارغاً"
          />

          {/* Event Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <label className="block text-xs font-bold text-white mb-2">اختر الفعاليات التي سيتم إرسالها لهذه القناة:</label>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 cursor-pointer transition">
                <span className="text-xs text-zinc-200 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-white" />
                  <span>إعلان فتح السكريمات والتحديات المفتوحة</span>
                </span>
                <input
                  type="checkbox"
                  checked={formEvents.scrim_created}
                  onChange={(e) => setFormEvents({ ...formEvents, scrim_created: e.target.checked })}
                  className="w-4 h-4 rounded accent-white cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 cursor-pointer transition">
                <span className="text-xs text-zinc-200 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-white" />
                  <span>إعلان نتائج المباريات المعتمدة وبطاقات الفوز (Scorecards)</span>
                </span>
                <input
                  type="checkbox"
                  checked={formEvents.match_completed}
                  onChange={(e) => setFormEvents({ ...formEvents, match_completed: e.target.checked })}
                  className="w-4 h-4 rounded accent-white cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 cursor-pointer transition">
                <span className="text-xs text-zinc-200 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-white" />
                  <span>نداء الجاهزية وغرفة التحكيم (War Room Alert)</span>
                </span>
                <input
                  type="checkbox"
                  checked={formEvents.war_room_alert}
                  onChange={(e) => setFormEvents({ ...formEvents, war_room_alert: e.target.checked })}
                  className="w-4 h-4 rounded accent-white cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 cursor-pointer transition">
                <span className="text-xs text-zinc-200 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>النشر التلقائي لمنشورات وإعلانات الفريق من الهب</span>
                </span>
                <input
                  type="checkbox"
                  checked={formEvents.team_posts}
                  onChange={(e) => setFormEvents({ ...formEvents, team_posts: e.target.checked })}
                  className="w-4 h-4 rounded accent-white cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 cursor-pointer transition">
                <span className="text-xs text-zinc-200 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-white" />
                  <span>إشعار التعاقدات وانضمام اللاعبين للتشكيلة</span>
                </span>
                <input
                  type="checkbox"
                  checked={formEvents.roster_updates}
                  onChange={(e) => setFormEvents({ ...formEvents, roster_updates: e.target.checked })}
                  className="w-4 h-4 rounded accent-white cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
