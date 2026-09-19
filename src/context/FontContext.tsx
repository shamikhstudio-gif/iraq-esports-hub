import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export type AppFontId = 'cairo' | 'ibm_plex' | 'readex' | 'alexandria' | 'tajawal';

export interface FontOption {
  id: AppFontId;
  name: string;
  nameEn: string;
  family: string;
  fontClass: string;
  description: string;
  badge?: string;
  sampleText: string;
}

export const APP_FONTS_CATALOG: FontOption[] = [
  {
    id: 'cairo',
    name: 'كايرو (Cairo)',
    nameEn: 'Cairo',
    family: "'Cairo', 'Inter', system-ui, sans-serif",
    fontClass: 'font-cairo',
    description: 'خط الألعاب التنافسية والـ Esports، حاد وعصري وبأوزان بارزة.',
    badge: 'الافتراضي',
    sampleText: 'العراق للرياضات الإلكترونية 2026'
  },
  {
    id: 'ibm_plex',
    name: 'آي بي إم بليكس (IBM Plex)',
    nameEn: 'IBM Plex Sans Arabic',
    family: "'IBM Plex Sans Arabic', 'Inter', system-ui, sans-serif",
    fontClass: 'font-ibm',
    description: 'تقني، متزن ودقيق جداً، مريح للعين في التصفح الطويل للبيانات.',
    badge: 'تقني فخم',
    sampleText: 'العراق للرياضات الإلكترونية 2026'
  },
  {
    id: 'readex',
    name: 'ريديكس برو (Readex Pro)',
    nameEn: 'Readex Pro',
    family: "'Readex Pro', 'Inter', system-ui, sans-serif",
    fontClass: 'font-readex',
    description: 'خط هندسي عصري من Google مصمم خصيصاً لوضوح الشاشات وواجهات المستخدم.',
    badge: 'عصري نقي',
    sampleText: 'العراق للرياضات الإلكترونية 2026'
  },
  {
    id: 'alexandria',
    name: 'الإسكندرية (Alexandria)',
    nameEn: 'Alexandria',
    family: "'Alexandria', 'Inter', system-ui, sans-serif",
    fontClass: 'font-alexandria',
    description: 'خط عريض وجريء بزوايا هندسية يمنح المنصة طابعاً مستقبلياً.',
    badge: 'هندسي جريء',
    sampleText: 'العراق للرياضات الإلكترونية 2026'
  },
  {
    id: 'tajawal',
    name: 'تجوال (Tajawal)',
    nameEn: 'Tajawal',
    family: "'Tajawal', 'Inter', system-ui, sans-serif",
    fontClass: 'font-tajawal',
    description: 'ناعم، كلاسيكي وبسيط، يمنح الواجهة مظهراً متزناً ومألوفاً.',
    badge: 'كلاسيكي متزن',
    sampleText: 'العراق للرياضات الإلكترونية 2026'
  }
];

const LOCAL_STORAGE_FONT_KEY = 'ieh_user_font';
const AUTH_USER_KEY = 'sb-user-id';

interface FontContextValue {
  fontId: AppFontId;
  savedFontId: AppFontId;
  setFontId: (id: AppFontId) => void;
  saveFontSettings: (customFontId?: AppFontId) => Promise<void>;
  revertFontSettings: () => void;
}

const FontContext = createContext<FontContextValue>({
  fontId: 'cairo',
  savedFontId: 'cairo',
  setFontId: () => {},
  saveFontSettings: async () => {},
  revertFontSettings: () => {},
});

function applyFontToDom(id: AppFontId) {
  if (typeof document === 'undefined') return;
  const found = APP_FONTS_CATALOG.find((f) => f.id === id) || APP_FONTS_CATALOG[0];
  document.documentElement.style.setProperty('--app-font-family', found.family);
  if (document.body) {
    document.body.style.fontFamily = found.family;
  }
}

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [savedFontId, setSavedFontId] = useState<AppFontId>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LOCAL_STORAGE_FONT_KEY) as AppFontId;
      if (stored && APP_FONTS_CATALOG.some((f) => f.id === stored)) {
        return stored;
      }
    }
    return 'cairo';
  });

  const [fontId, setFontIdState] = useState<AppFontId>(savedFontId);

  // Apply font immediately to DOM
  useEffect(() => {
    applyFontToDom(fontId);
  }, [fontId]);

  // Sync with remote user profile
  useEffect(() => {
    let isMounted = true;
    async function syncRemotePrefs() {
      try {
        const userId = typeof window !== 'undefined' ? localStorage.getItem(AUTH_USER_KEY) : null;
        if (!userId) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('privacy_preferences')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.privacy_preferences && isMounted) {
          const remoteFont = profile.privacy_preferences.global_font as AppFontId;
          if (remoteFont && APP_FONTS_CATALOG.some((f) => f.id === remoteFont)) {
            setFontIdState(remoteFont);
            setSavedFontId(remoteFont);
            localStorage.setItem(LOCAL_STORAGE_FONT_KEY, remoteFont);
            applyFontToDom(remoteFont);
          }
        }
      } catch (err) {
        console.warn('Could not sync font preference from profile:', err);
      }
    }

    syncRemotePrefs();
    return () => {
      isMounted = false;
    };
  }, []);

  const setFontId = useCallback((newId: AppFontId) => {
    setFontIdState(newId);
    applyFontToDom(newId);
  }, []);

  const revertFontSettings = useCallback(() => {
    setFontIdState(savedFontId);
    applyFontToDom(savedFontId);
  }, [savedFontId]);

  const saveFontSettings = useCallback(
    async (customFontId?: AppFontId) => {
      const target = customFontId || fontId;
      setSavedFontId(target);
      setFontIdState(target);
      applyFontToDom(target);

      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_FONT_KEY, target);
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
          global_font: target,
        };

        await supabase
          .from('profiles')
          .update({ privacy_preferences: updatedPrefs })
          .eq('id', userId);
      } catch (err) {
        console.warn('Failed saving font setting to database:', err);
      }
    },
    [fontId]
  );

  return (
    <FontContext.Provider
      value={{
        fontId,
        savedFontId,
        setFontId,
        saveFontSettings,
        revertFontSettings,
      }}
    >
      {children}
    </FontContext.Provider>
  );
}

export function useAppFont() {
  return useContext(FontContext);
}
