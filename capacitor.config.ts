import type { CapacitorConfig } from '@capacitor/cli';

const isLiveReload = process.env.LIVE_RELOAD === 'true';

const config: CapacitorConfig = {
  appId: 'com.eshamikh.ieh',
  appName: 'Iraq Esports Hub',
  webDir: 'dist',
  server: {
    url: isLiveReload ? 'http://localhost:3000' : 'https://iraq-esports-hub.pages.dev',
    cleartext: isLiveReload,
    allowNavigation: [
      'iraq-esports-hub.pages.dev',
      '*.pages.dev',
      'iraqesportshub.com',
      '*.supabase.co',
      '*.cloudinary.com',
      'api.dicebear.com',
    ],
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
