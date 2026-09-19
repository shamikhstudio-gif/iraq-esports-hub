'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  RotateCcw,
  Zap,
  Activity,
  Terminal, 
  Grid, 
  Gauge,
  Type
} from 'lucide-react';
import { 
  useAppBackground, 
  GLOBAL_BG_EFFECTS_CATALOG, 
  GlobalBackgroundEffectType, 
  BackgroundIntensityType,
  BackgroundSpeedType
} from '@/context/BackgroundContext';
import { 
  useAppFont, 
  APP_FONTS_CATALOG, 
  AppFontId 
} from '@/context/FontContext';
import { Button, Badge } from '@/components/ui';

interface AppearanceTabProps {
  triggerChange?: () => void;
  onSaved?: () => void;
  registerTabActions?: (tab: 'appearance', actions: { save: () => Promise<void>; revert: () => void }) => void;
  cancelSignal?: number;
}

function renderEffectIcon(id: GlobalBackgroundEffectType, isSelected: boolean) {
  const iconColor = isSelected ? '#000000' : '#d4d4d8';
  const iconClass = `w-4 h-4 shrink-0 transition ${isSelected ? 'text-black' : 'text-zinc-300 group-hover:text-white'}`;
  const iconProps = { className: iconClass, style: { color: iconColor }, color: iconColor };

  switch (id) {
    case 'none': return <Layers {...iconProps} />;
    case 'neural_plexus': return <Activity {...iconProps} />;
    case 'hyperspace_warp': return <Zap {...iconProps} />;
    case 'matrix_rain': return <Terminal {...iconProps} />;
    case 'hex_tactical_shield': return <Grid {...iconProps} />;
    case 'cosmic_dust': return <Sparkles {...iconProps} />;
    case 'audio_waveform': return <Activity {...iconProps} />;
    case 'lightning_pulse': return <Zap {...iconProps} />;
    case 'crt_scanlines': return <Activity {...iconProps} />;
    case 'vortex_grid': return <Grid {...iconProps} />;
    default: return <Layers {...iconProps} />;
  }
}

export function AppearanceTab({ triggerChange, onSaved, registerTabActions, cancelSignal }: AppearanceTabProps) {
  const { 
    effect, 
    intensity, 
    speed,
    savedEffect,
    savedIntensity,
    savedSpeed,
    setEffect, 
    setIntensity, 
    setSpeed, 
    saveBackgroundSettings,
    revertBackgroundSettings,
  } = useAppBackground();

  const {
    fontId,
    savedFontId,
    setFontId,
    saveFontSettings,
    revertFontSettings,
  } = useAppFont();

  // Local draft states
  const [selectedEffect, setSelectedEffect] = useState<GlobalBackgroundEffectType>(effect);
  const [selectedIntensity, setSelectedIntensity] = useState<BackgroundIntensityType>(intensity);
  const [selectedSpeed, setSelectedSpeed] = useState<BackgroundSpeedType>(speed);
  const [selectedFont, setSelectedFont] = useState<AppFontId>(fontId);

  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Keep in sync with context
  useEffect(() => {
    setSelectedEffect(effect);
    setSelectedIntensity(intensity);
    setSelectedSpeed(speed);
  }, [effect, intensity, speed]);

  useEffect(() => {
    setSelectedFont(fontId);
  }, [fontId]);

  const handleSelectFont = (fId: AppFontId) => {
    setSelectedFont(fId);
    setFontId(fId); // live immediate application to entire document
    triggerChange?.();
  };

  const handleSelectEffect = (eff: GlobalBackgroundEffectType) => {
    setSelectedEffect(eff);
    setEffect(eff); // live immediate application to actual background
    triggerChange?.();
  };

  const handleSelectIntensity = (int: BackgroundIntensityType) => {
    setSelectedIntensity(int);
    setIntensity(int); // live immediate application to actual background
    triggerChange?.();
  };

  const handleSelectSpeed = (spd: BackgroundSpeedType) => {
    setSelectedSpeed(spd);
    setSpeed(spd); // live immediate application to actual background
    triggerChange?.();
  };

  const handleSave = React.useCallback(async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        saveBackgroundSettings(selectedEffect, selectedIntensity, selectedSpeed),
        saveFontSettings(selectedFont)
      ]);
      setSaveToast(true);
      onSaved?.();
      setTimeout(() => setSaveToast(false), 2500);
    } catch (err) {
      console.error('Error saving appearance settings:', err);
    } finally {
      setIsSaving(false);
    }
  }, [saveBackgroundSettings, saveFontSettings, selectedEffect, selectedIntensity, selectedSpeed, selectedFont, onSaved]);

  const handleRevert = React.useCallback(() => {
    revertBackgroundSettings();
    revertFontSettings();
    setSelectedEffect(savedEffect);
    setSelectedIntensity(savedIntensity);
    setSelectedSpeed(savedSpeed);
    setSelectedFont(savedFontId);
  }, [revertBackgroundSettings, revertFontSettings, savedEffect, savedIntensity, savedSpeed, savedFontId]);

  // Root coordination: Register tab save & revert handlers with SettingsPage
  useEffect(() => {
    registerTabActions?.('appearance', {
      save: handleSave,
      revert: handleRevert,
    });
  }, [registerTabActions, handleSave, handleRevert]);

  // Root coordination: Revert immediately when cancel signal fires from SettingsPage
  useEffect(() => {
    if (cancelSignal) {
      handleRevert();
    }
  }, [cancelSignal, handleRevert]);

  const handleReset = () => {
    handleSelectFont('cairo');
    handleSelectEffect('none');
    handleSelectIntensity('medium');
    handleSelectSpeed('normal');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Info Box */}
      <div className="card-3d p-5 sm:p-6 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span>مظهر المنصة والخطوط ومؤثرات الخلفية</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              خصّص الخط العربي الرسمي للمنصة ومؤثر الخلفية الحركي التفاعلي بالكامل وفق ذوقك الشخصي.
            </p>
          </div>

          <Badge variant="outline" size="sm" className="hidden sm:inline-flex shrink-0">
            <span>100% Monochrome</span>
          </Badge>
        </div>
      </div>

      {/* Typography Selector Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-white" />
              <span>نوع الخط العربي (Typography)</span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              اختر خط المنصة المناسب لذوقك، يُطبّق فورياً ومباشرة على كامل العناوين والنصوص والأزرار.
            </p>
          </div>
          <Badge variant="outline" size="sm">
            <span>5 خطوط رسمية</span>
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {APP_FONTS_CATALOG.map((font) => {
            const isSelected = selectedFont === font.id;
            return (
              <div
                key={font.id}
                onClick={() => handleSelectFont(font.id)}
                className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-white/10 border-white shadow-[0_0_25px_rgba(255,255,255,0.18)] ring-1 ring-white'
                    : 'bg-[#0a0a0a] border-white/10 hover:border-white/30 hover:bg-white/[0.04]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-black text-white">{font.name}</span>
                    {font.badge && (
                      <Badge variant={isSelected ? 'solid' : 'outline'} size="xs">
                        <span>{font.badge}</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">
                    {font.description}
                  </p>
                </div>

                {/* Live Font Sample */}
                <div className="pt-2 border-t border-white/10">
                  <div className={`text-base font-bold text-white tracking-wide ${font.fontClass}`}>
                    {font.sampleText}
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[10px] font-mono text-zinc-500">
                      {font.nameEn}
                    </span>
                    {isSelected ? (
                      <span className="text-[10px] font-bold text-white flex items-center gap-1">
                        <Check className="w-3 h-3 text-white" />
                        <span>الخط النشط</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-medium">
                        تفعيل الخط
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls Grid: Intensity + Speed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Intensity (Opacity) Controls */}
        <div className="card-3d p-5 space-y-3">
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-white" />
              <span>مستوى الشفافية والكثافة</span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              درجة وضوح وظهور المؤثر خلف البطاقات والنصوص.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'low' as BackgroundIntensityType, label: 'خفيف', pct: '25%' },
              { id: 'medium' as BackgroundIntensityType, label: 'معتدل', pct: '50%' },
              { id: 'high' as BackgroundIntensityType, label: 'حيوي', pct: '80%' },
            ].map((item) => {
              const isSelected = selectedIntensity === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectIntensity(item.id)}
                  className={`p-3 rounded-xl text-center transition border cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-lg font-black'
                      : 'bg-[#0a0a0a] text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-black">{item.label}</div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    {item.pct}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Speed Controls */}
        <div className="card-3d p-5 space-y-3">
          <div>
            <h3 className="text-xs font-black text-white flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5 text-white" />
              <span>سرعة حركة المؤثر</span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              معدل سرعة دوران وتساقط وحركة المؤثرات التفاعلية.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'slow' as BackgroundSpeedType, label: 'هادئ', multiplier: '0.5x' },
              { id: 'normal' as BackgroundSpeedType, label: 'قياسي', multiplier: '1.0x' },
              { id: 'fast' as BackgroundSpeedType, label: 'سريع', multiplier: '1.8x' },
            ].map((item) => {
              const isSelected = selectedSpeed === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectSpeed(item.id)}
                  className={`p-3 rounded-xl text-center transition border cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black border-white shadow-lg font-black'
                      : 'bg-[#0a0a0a] text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-black">{item.label}</div>
                  <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-zinc-700' : 'text-zinc-500'}`}>
                    {item.multiplier}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Effects Catalog Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-white flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-white" />
            <span>كتالوج مؤثرات الخلفية ({GLOBAL_BG_EFFECTS_CATALOG.length})</span>
          </h3>
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>إعادة للوضع الافتراضي</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {GLOBAL_BG_EFFECTS_CATALOG.map((item) => {
            const isSelected = selectedEffect === item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleSelectEffect(item.id)}
                className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-white/10 border-white shadow-[0_0_25px_rgba(255,255,255,0.18)] ring-1 ring-white'
                    : 'bg-[#0a0a0a] border-white/10 hover:border-white/30 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition border ${
                        isSelected
                          ? 'bg-white text-black border-white'
                          : 'bg-[#141414] text-zinc-300 border-white/10 group-hover:text-white group-hover:border-white/30'
                      }`}
                    >
                      {renderEffectIcon(item.id, isSelected)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-white flex items-center gap-2">
                        <span>{item.nameAr}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono">{item.name}</div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border shrink-0 ${
                      isSelected
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 text-zinc-400 border-white/10'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {item.descAr}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    ويب • موبايل • ديسكتوب
                  </span>

                  {isSelected ? (
                    <span className="text-[10px] font-bold text-white flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>المؤثر النشط حالياً</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-medium">
                      انقر للتفعيل الفوري
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer Button */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {saveToast ? (
            <span className="text-white font-bold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-white" />
              تم حفظ تفضيلات المظهر بنجاح!
            </span>
          ) : (
            <span>تُطبّق التغييرات لحظياً في الخلفية، واضغط هنا لتثبيتها بحسابك.</span>
          )}
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="font-black px-6"
        >
          {isSaving ? 'جاري الحفظ...' : 'حفظ التفضيلات'}
        </Button>
      </div>
    </div>
  );
}
