'use client';

import React, { useState } from 'react';
import { X, Zap, Eye, Save, Crown, Loader2, Upload, Type, Wand2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TeamEntrySplash } from './TeamEntrySplash';
import { Button } from '@/components/ui';

interface SplashConfig {
  text?: string;
  font?: string;
  text_gradient?: string[];
  image_url?: string | null;
  animation_type?: 'zoom' | 'glitch' | 'scanline' | 'flip' | 'fade';
  backdrop_type?: 'blur' | 'color' | 'gradient';
  backdrop_color?: string;
  backdrop_blur?: number;
  duration?: number;
}

interface TeamSplashStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  teamLogo?: string | null;
  initialConfig?: SplashConfig | null;
  onSave: (config: SplashConfig) => void;
}

const ANIMATION_OPTIONS = [
  { id: 'zoom', label: 'Zoom Blast', desc: 'يتفجر من المركز' },
  { id: 'glitch', label: 'Cyber Glitch', desc: 'تأثير تشويش إلكتروني' },
  { id: 'flip', label: '3D Flip', desc: 'انقلاب ثلاثي الأبعاد' },
  { id: 'scanline', label: 'Neon Scanline', desc: 'شاشة قديمة نيون' },
  { id: 'fade', label: 'Clean Fade', desc: 'ظهور ناعم وأنيق' },
];

const GRADIENT_PRESETS = [
  { label: 'أبيض نقي', colors: ['#ffffff', '#ffffff'] },
  { label: 'فضي معدني', colors: ['#ffffff', '#a1a1aa'] },
  { label: 'تيتانيوم داكن', colors: ['#e4e4e7', '#71717a'] },
  { label: 'كاربون فايبر', colors: ['#a1a1aa', '#27272a'] },
  { label: 'شبح أسود', colors: ['#71717a', '#000000'] },
];

export function TeamSplashStudioModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  teamLogo,
  initialConfig,
  onSave,
}: TeamSplashStudioModalProps) {
  const [config, setConfig] = useState<SplashConfig>(initialConfig || {
    text: teamName,
    font: 'sans',
    text_gradient: ['#ffffff', '#a0a0a0'],
    image_url: null,
    animation_type: 'zoom',
    backdrop_type: 'blur',
    backdrop_color: '#000000',
    backdrop_blur: 16,
    duration: 4,
  });
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'content' | 'animation' | 'backdrop'>('content');

  const update = (changes: Partial<SplashConfig>) => setConfig(prev => ({ ...prev, ...changes }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('teams')
        .update({ entry_splash_config: config })
        .eq('id', teamId);
      if (error) throw error;
      onSave(config);
      onClose();
    } catch (err) {
      console.error('Error saving splash config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'content', label: 'المحتوى', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'animation', label: 'الأنيميشن', icon: <Wand2 className="w-3.5 h-3.5" /> },
    { id: 'backdrop', label: 'الخلفية', icon: <Crown className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/95" onClick={onClose} />

        <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-[#0a0a0a] border border-white/15 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Top Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer">
              <X className="w-4 h-4 text-white" />
            </button>
            <div className="text-center">
              <h2 className="text-sm font-black text-white">استوديو دخول الفريق</h2>
              <p className="text-[10px] text-zinc-500">{teamName}</p>
            </div>
            <Button
              variant="secondary"
              size="xs"
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => setIsPreviewOpen(true)}
            >
              <span>معاينة</span>
            </Button>
          </div>

          {/* Tab Nav */}
          <div className="flex border-b border-white/10 shrink-0" dir="rtl">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold transition ${
                  activeSection === tab.id
                    ? 'text-white border-b-2 border-white bg-white/10'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4" dir="rtl">
            
            {activeSection === 'content' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">نص العنوان</label>
                  <input
                    type="text"
                    value={config.text || ''}
                    onChange={e => update({ text: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-white/15 text-white text-sm focus:outline-none focus:border-white"
                    placeholder="مثال: ذئاب بغداد • الأفضل في العراق"
                    maxLength={60}
                  />
                  <div className="text-[10px] text-zinc-600 mt-1 text-left font-mono">{(config.text || '').length}/60</div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">نمط الخط</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'sans', label: 'عصري' },
                      { id: 'mono', label: 'Mono' },
                      { id: 'serif', label: 'Serif' },
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => update({ font: f.id })}
                        className={`py-2.5 rounded-xl text-xs font-bold transition ${
                          config.font === f.id ? 'bg-white text-black' : 'bg-[#141414] border border-white/10 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">لون النص (تدرج لوني)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {GRADIENT_PRESETS.map(preset => (
                      <button
                        key={preset.label}
                        onClick={() => update({ text_gradient: preset.colors })}
                        className={`py-2.5 px-3 rounded-xl text-[10px] font-bold transition border text-center ${
                          JSON.stringify(config.text_gradient) === JSON.stringify(preset.colors)
                            ? 'border-white/50 shadow-md'
                            : 'border-white/10 hover:border-white/25'
                        }`}
                        style={{
                          background: `linear-gradient(135deg, ${preset.colors.join(', ')})`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">صورة مخصصة (PNG بدل النص)</label>
                  <input
                    type="url"
                    value={config.image_url || ''}
                    onChange={e => update({ image_url: e.target.value || null })}
                    className="w-full px-4 py-3 rounded-xl bg-[#141414] border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-white text-left"
                    placeholder="https://i.imgur.com/logo.png"
                    dir="ltr"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">إذا أضفت صورة، ستحل محل النص.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">مدة الظهور</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={2} max={8} step={1}
                      value={config.duration || 4}
                      onChange={e => update({ duration: parseInt(e.target.value) })}
                      className="flex-1 accent-white"
                    />
                    <span className="text-sm font-black text-white font-mono w-16 text-center">
                      {config.duration || 4} ثوان
                    </span>
                  </div>
                </div>
              </>
            )}

            {activeSection === 'animation' && (
              <div className="space-y-2">
                {ANIMATION_OPTIONS.map(anim => (
                  <button
                    key={anim.id}
                    onClick={() => update({ animation_type: anim.id as any })}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition text-right border ${
                      config.animation_type === anim.id
                        ? 'bg-white/15 border-white shadow-sm'
                        : 'bg-[#141414] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="text-[10px] text-zinc-400">{anim.desc}</div>
                    <div className="text-sm font-bold text-white">{anim.label}</div>
                  </button>
                ))}
              </div>
            )}

            {activeSection === 'backdrop' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-2">نوع خلفية الموقع</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'blur', label: 'ضبابي (Blur)' },
                      { id: 'color', label: 'لون صلب' },
                      { id: 'gradient', label: 'تدرج لوني' },
                    ].map(bt => (
                      <button
                        key={bt.id}
                        onClick={() => update({ backdrop_type: bt.id as any })}
                        className={`py-2.5 rounded-xl text-xs font-bold transition ${
 config.backdrop_type === bt.id ? 'bg-white text-black' : 'bg-[#141414] border border-white/10 text-zinc-400 hover:text-white'
 }`}
                      >
                        {bt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {config.backdrop_type === 'blur' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">شدة الضبابية</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={4} max={40} step={4}
                        value={config.backdrop_blur || 16}
                        onChange={e => update({ backdrop_blur: parseInt(e.target.value) })}
                        className="flex-1 accent-white"
                      />
                      <span className="text-sm font-black text-white font-mono w-16 text-center">
                        {config.backdrop_blur || 16}px
                      </span>
                    </div>
                  </div>
                )}

                {(config.backdrop_type === 'color' || config.backdrop_type === 'gradient') && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">لون الخلفية</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={config.backdrop_color || '#000000'}
                        onChange={e => update({ backdrop_color: e.target.value })}
                        className="w-12 h-12 rounded-xl cursor-pointer border-0 p-1 bg-[#141414]"
                      />
                      <input
                        type="text"
                        value={config.backdrop_color || '#000000'}
                        onChange={e => update({ backdrop_color: e.target.value })}
                        className="flex-1 px-4 py-3 rounded-xl bg-[#141414] border border-white/15 text-white text-xs font-mono focus:outline-none"
                        dir="ltr"
                      />
                    </div>
                    <div className="grid grid-cols-5 gap-2 mt-3">
                      {['#000000', '#0a0a0a', '#141414', '#1f1f1f', '#262626'].map(color => (
                        <button
                          key={color}
                          onClick={() => update({ backdrop_color: color })}
                          className="h-8 rounded-lg border border-white/10 hover:border-white/30 transition"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-white/10 flex items-center gap-3 shrink-0" dir="rtl">
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              icon={<Save className="w-4 h-4" />}
              isLoading={isSaving}
              onClick={handleSave}
            >
              <span>حفظ ونشر أنيميشن الدخول</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => setIsPreviewOpen(true)}
            >
              <span>معاينة</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Live Preview Splash */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[60]">
          <TeamEntrySplash
            config={config}
            teamName={teamName}
            teamLogo={teamLogo}
          />
          <Button
            variant="secondary"
            size="md"
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70]"
            onClick={() => setIsPreviewOpen(false)}
          >
            <span>← إغلاق المعاينة والعودة للاستوديو</span>
          </Button>
        </div>
      )}
    </>
  );
}
