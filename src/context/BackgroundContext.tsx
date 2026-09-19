'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AUTH_USER_KEY } from '@/lib/constants';

export type GlobalBackgroundEffectType =
  | 'none'
  | 'matrix_rain'
  | 'cosmic_dust'
  | 'neural_plexus'
  | 'hyperspace_warp'
  | 'hex_tactical_shield'
  | 'audio_waveform'
  | 'lightning_pulse'
  | 'crt_scanlines'
  | 'vortex_grid';

export type BackgroundIntensityType = 'low' | 'medium' | 'high';
export type BackgroundSpeedType = 'slow' | 'normal' | 'fast';

export interface BackgroundEffectItem {
  id: GlobalBackgroundEffectType;
  name: string;
  nameAr: string;
  descAr: string;
  badge: string;
}

export const GLOBAL_BG_EFFECTS_CATALOG: BackgroundEffectItem[] = [
  {
    id: 'none',
    name: 'Obsidian Pure Black',
    nameAr: 'أسود أوبسيديان صافٍ (افتراضي)',
    descAr: 'الخلفية الداكنة الصافية بدون أي مؤثرات متحركة أو جزيئات إضافية.',
    badge: 'الوضع الكلاسيكي',
  },
  {
    id: 'neural_plexus',
    name: 'Cyber Neural Plexus',
    nameAr: 'شبكة العقد والروابط العصبية',
    descAr: 'عقد تكتيكية عائمة تترابط تلقائياً بخطوط ليزرية هندسية عند اقترابها من بعضها.',
    badge: 'شبكة متصلة',
  },
  {
    id: 'hyperspace_warp',
    name: 'Hyperspace Warp Drive',
    nameAr: 'قفزة الهايبرسبيس الفضائية 3D',
    descAr: 'نجوم تندفع من مركز الشاشة إلى الأطراف بسرعة ثلاثية الأبعاد تحاكي سرعة الضوء.',
    badge: 'سرعة قصوى',
  },
  {
    id: 'matrix_rain',
    name: 'Matrix Cyber Stream',
    nameAr: 'أمطار الماتريكس الرقمية',
    descAr: 'رموز برمجية وشفرات باينري أحادية تتساقط عمودياً في فضاء التطبيق الخلفي.',
    badge: 'سايبر تكتيكي',
  },
  {
    id: 'hex_tactical_shield',
    name: 'Hex Tactical Shield',
    nameAr: 'درع الطاقة السداسي التكتيكي',
    descAr: 'خلايا خلايا النحل السداسية المستقبلية تنبض وتتنفس بأسلوب درع حربي عسكري.',
    badge: 'درع تكتيكي',
  },
  {
    id: 'cosmic_dust',
    name: 'Cosmic Stardust Motes',
    nameAr: 'غبار النجوم الكوني الأثيري',
    descAr: 'جزيئات سديمية عائمة تسبح بهدوء وانسيابية مع وميض أبيض دقيق.',
    badge: 'فضاء عميق',
  },
  {
    id: 'audio_waveform',
    name: 'Cyber Audio Waveform',
    nameAr: 'موجات الترددات الصوتية',
    descAr: 'موجات إلكترونية جيبية انسيابية متداخلة تحاكي رادارات وترددات الاتصال الصوتي.',
    badge: 'ترددات صوتية',
  },
  {
    id: 'lightning_pulse',
    name: 'Hyper Lightning Pulse',
    nameAr: 'نبضات الصواعق الكهربائية',
    descAr: 'تفريغات برق خاطفة تنبض على الأطراف وتضفي طاقة حماسية للساحات التنافسية.',
    badge: 'طاقة تنافسية',
  },
  {
    id: 'crt_scanlines',
    name: 'Tactical CRT Scanline',
    nameAr: 'شاشات الرادار والمسح CRT',
    descAr: 'خطوط مسح شاشات القتال التكتيكية مع وميض وتوهج سينمائي عالي الدقة.',
    badge: 'رادار حربي',
  },
  {
    id: 'vortex_grid',
    name: 'Cyber 3D Vortex Grid',
    nameAr: 'الشبكة التكتيكية ثلاثية الأبعاد',
    descAr: 'شبكة أفقية ثلاثية الأبعاد تتحرك بانسيابية في الأفق بأسلوب سايبربانك مستقبلي.',
    badge: 'أفق ثلاثي الأبعاد',
  },
];

const LOCAL_STORAGE_EFFECT_KEY = 'ieh_global_bg_effect';
const LOCAL_STORAGE_INTENSITY_KEY = 'ieh_global_bg_intensity';
const LOCAL_STORAGE_SPEED_KEY = 'ieh_global_bg_speed';

interface BackgroundContextValue {
  effect: GlobalBackgroundEffectType;
  intensity: BackgroundIntensityType;
  speed: BackgroundSpeedType;
  savedEffect: GlobalBackgroundEffectType;
  savedIntensity: BackgroundIntensityType;
  savedSpeed: BackgroundSpeedType;
  setEffect: (effect: GlobalBackgroundEffectType) => void;
  setIntensity: (intensity: BackgroundIntensityType) => void;
  setSpeed: (speed: BackgroundSpeedType) => void;
  revertBackgroundSettings: () => void;
  saveBackgroundSettings: (
    customEffect?: GlobalBackgroundEffectType,
    customIntensity?: BackgroundIntensityType,
    customSpeed?: BackgroundSpeedType
  ) => Promise<void>;
}

const BackgroundContext = createContext<BackgroundContextValue>({
  effect: 'none',
  intensity: 'medium',
  speed: 'normal',
  savedEffect: 'none',
  savedIntensity: 'medium',
  savedSpeed: 'normal',
  setEffect: () => {},
  setIntensity: () => {},
  setSpeed: () => {},
  revertBackgroundSettings: () => {},
  saveBackgroundSettings: async () => {},
});

export function BackgroundProvider({ children }: { children: React.ReactNode }) {
  // 1. Saved state (committed to localStorage and database)
  const [savedEffect, setSavedEffect] = useState<GlobalBackgroundEffectType>(() => {
    if (typeof window === 'undefined') return 'none';
    return (localStorage.getItem(LOCAL_STORAGE_EFFECT_KEY) as GlobalBackgroundEffectType) || 'none';
  });

  const [savedIntensity, setSavedIntensity] = useState<BackgroundIntensityType>(() => {
    if (typeof window === 'undefined') return 'medium';
    return (localStorage.getItem(LOCAL_STORAGE_INTENSITY_KEY) as BackgroundIntensityType) || 'medium';
  });

  const [savedSpeed, setSavedSpeed] = useState<BackgroundSpeedType>(() => {
    if (typeof window === 'undefined') return 'normal';
    return (localStorage.getItem(LOCAL_STORAGE_SPEED_KEY) as BackgroundSpeedType) || 'normal';
  });

  // 2. Active preview state (what is currently rendering across the app)
  const [effect, setEffectState] = useState<GlobalBackgroundEffectType>(savedEffect);
  const [intensity, setIntensityState] = useState<BackgroundIntensityType>(savedIntensity);
  const [speed, setSpeedState] = useState<BackgroundSpeedType>(savedSpeed);

  // Sync with remote user profile preferences when available
  useEffect(() => {
    async function loadRemotePreferences() {
      try {
        const userId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
        if (!userId) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('privacy_preferences')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.privacy_preferences?.global_bg_effect) {
          const remoteEffect = profile.privacy_preferences.global_bg_effect as GlobalBackgroundEffectType;
          setSavedEffect(remoteEffect);
          setEffectState(remoteEffect);
          localStorage.setItem(LOCAL_STORAGE_EFFECT_KEY, remoteEffect);
        }

        if (profile?.privacy_preferences?.global_bg_intensity) {
          const remoteIntensity = profile.privacy_preferences.global_bg_intensity as BackgroundIntensityType;
          setSavedIntensity(remoteIntensity);
          setIntensityState(remoteIntensity);
          localStorage.setItem(LOCAL_STORAGE_INTENSITY_KEY, remoteIntensity);
        }

        if (profile?.privacy_preferences?.global_bg_speed) {
          const remoteSpeed = profile.privacy_preferences.global_bg_speed as BackgroundSpeedType;
          setSavedSpeed(remoteSpeed);
          setSpeedState(remoteSpeed);
          localStorage.setItem(LOCAL_STORAGE_SPEED_KEY, remoteSpeed);
        }
      } catch (err) {
        console.warn('Could not sync background preferences from remote profile:', err);
      }
    }

    loadRemotePreferences();
  }, []);

  const setEffect = useCallback((newEffect: GlobalBackgroundEffectType) => {
    setEffectState(newEffect);
  }, []);

  const setIntensity = useCallback((newIntensity: BackgroundIntensityType) => {
    setIntensityState(newIntensity);
  }, []);

  const setSpeed = useCallback((newSpeed: BackgroundSpeedType) => {
    setSpeedState(newSpeed);
  }, []);

  // Revert active state back to saved state when user cancels
  const revertBackgroundSettings = useCallback(() => {
    setEffectState(savedEffect);
    setIntensityState(savedIntensity);
    setSpeedState(savedSpeed);
  }, [savedEffect, savedIntensity, savedSpeed]);

  // Commit and save active state to persistent storage
  const saveBackgroundSettings = useCallback(
    async (
      customEffect?: GlobalBackgroundEffectType,
      customIntensity?: BackgroundIntensityType,
      customSpeed?: BackgroundSpeedType
    ) => {
      const targetEffect = customEffect !== undefined ? customEffect : effect;
      const targetIntensity = customIntensity !== undefined ? customIntensity : intensity;
      const targetSpeed = customSpeed !== undefined ? customSpeed : speed;

      setSavedEffect(targetEffect);
      setSavedIntensity(targetIntensity);
      setSavedSpeed(targetSpeed);
      setEffectState(targetEffect);
      setIntensityState(targetIntensity);
      setSpeedState(targetSpeed);

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_EFFECT_KEY, targetEffect);
        localStorage.setItem(LOCAL_STORAGE_INTENSITY_KEY, targetIntensity);
        localStorage.setItem(LOCAL_STORAGE_SPEED_KEY, targetSpeed);
      }

      try {
        const userId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
        if (!userId) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('privacy_preferences')
          .eq('id', userId)
          .maybeSingle();

        const currentPrefs = profile?.privacy_preferences || {};
        const updatedPrefs = {
          ...currentPrefs,
          global_bg_effect: targetEffect,
          global_bg_intensity: targetIntensity,
          global_bg_speed: targetSpeed,
        };

        await supabase
          .from('profiles')
          .update({ privacy_preferences: updatedPrefs })
          .eq('id', userId);
      } catch (err) {
        console.warn('Failed saving global background settings to database:', err);
      }
    },
    [effect, intensity, speed]
  );

  return (
    <BackgroundContext.Provider
      value={{
        effect,
        intensity,
        speed,
        savedEffect,
        savedIntensity,
        savedSpeed,
        setEffect,
        setIntensity,
        setSpeed,
        revertBackgroundSettings,
        saveBackgroundSettings,
      }}
    >
      {children}
    </BackgroundContext.Provider>
  );
}

export function useAppBackground() {
  return useContext(BackgroundContext);
}
