'use client';

import React from 'react';
import { 
  Lock, 
  Mic, 
  Plus, 
  Trash2 
} from 'lucide-react';
import { CustomSelect } from '@/components/CustomSelect';
import { Team } from '@/lib/types';
import { Button, Badge, Card } from '@/components/ui';

interface TeamRulesTabProps {
  team: Team;
  isExclusive: boolean;
  setIsExclusive: (val: boolean) => void;
  recruitmentStatus: string;
  setRecruitmentStatus: (val: string) => void;
  minRank: string;
  setMinRank: (val: string) => void;
  discordUrl: string;
  setDiscordUrl: (val: string) => void;
  voiceRequired: boolean;
  setVoiceRequired: (val: boolean) => void;
  rulesList: string[];
  newRuleInput: string;
  setNewRuleInput: (val: string) => void;
  handleAddRule: () => void;
  handleRemoveRule: (idx: number) => void;
}

export function TeamRulesTab({
  team,
  isExclusive,
  setIsExclusive,
  recruitmentStatus,
  setRecruitmentStatus,
  minRank,
  setMinRank,
  discordUrl,
  setDiscordUrl,
  voiceRequired,
  setVoiceRequired,
  rulesList,
  newRuleInput,
  setNewRuleInput,
  handleAddRule,
  handleRemoveRule,
}: TeamRulesTabProps) {
  return (
    <div className="space-y-6">
      {/* Exclusivity Lock Box */}
      <Card variant="elevated" className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-black text-white">
            <Lock className="w-4 h-4 text-white" />
            <span>قانون الحصرية والالتزام التام (Exclusivity Rule)</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
            عند تفعيل هذا الخيار، يُمنع أي عضو في الفريق من الانضمام لفرق أخرى في نفس الوقت، وتعتبر عضويته رسمية وحصرية لـ [{team.tag}].
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={isExclusive}
            onChange={(e) => setIsExclusive(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-[#1e1e1e] border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:bg-white peer-checked:border-white transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-black"></div>
        </label>
      </Card>

      {/* Recruitment & Prerequisites */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CustomSelect
          label="حالة التقديم والتجارب:"
          value={recruitmentStatus}
          onChange={setRecruitmentStatus}
          options={[
            { value: 'open', label: 'مفتوح للجميع (Open Tryouts)' },
            { value: 'invite_only', label: 'بالدعوة فقط (Invite Only)' },
            { value: 'closed', label: 'مغلق حالياً (Closed)' },
          ]}
        />

        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5">
            الحد الأدنى للرتبة (Min Rank):
          </label>
          <input
            type="text"
            value={minRank}
            onChange={(e) => setMinRank(e.target.value)}
            placeholder="مثال: Immortal 2 / Conqueror"
            className="w-full text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-1.5">
            رابط ديسكورد الفريق:
          </label>
          <input
            type="url"
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
            placeholder="https://discord.gg/..."
            className="w-full text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Voice Chat Toggle */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#080808] border border-white/10 shadow-inner">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
          <Mic className="w-4 h-4 text-white" />
          <span>اشتراط وجود مايك وتواصل صوتي واضح أثناء التدريب</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={voiceRequired}
            onChange={(e) => setVoiceRequired(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-[#1e1e1e] border border-white/20 peer-focus:outline-none rounded-full peer peer-checked:bg-white peer-checked:border-white transition-colors duration-200 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-black"></div>
        </label>
      </div>

      {/* Dynamic Rules List */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-zinc-200">
          بنود وقوانين الفريق المخصصة:
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={newRuleInput}
            onChange={(e) => setNewRuleInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddRule()}
            placeholder="أضف بنداً جديداً (مثال: عدم الغياب عن التمارين بدون عذر مسبق)..."
            className="flex-1 text-xs p-2.5 rounded-xl input-3d text-white placeholder-zinc-500 focus:outline-none"
          />
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleAddRule}
          >
            <span>إضافة بند</span>
          </Button>
        </div>

        <div className="space-y-2 pt-2">
          {rulesList.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-[#0c0c0c] border border-white/10 text-xs font-semibold text-zinc-200 shadow-sm group"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-extrabold font-mono shadow-xs">
                  {idx + 1}
                </span>
                <span>{rule}</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleRemoveRule(idx)}
                className="text-zinc-400 hover:text-white"
                title="حذف هذا البند"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
