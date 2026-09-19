/**
 * Device & Session Management Utility for Iraq Esports Hub
 * Detects real client browser, operating system, device type, and manages active login sessions.
 */

import { supabase } from '@/lib/supabase';

export interface DeviceSession {
  id: string;
  userId: string;
  deviceName: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  ipAddress: string;
  location: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

export function detectClientDevice(): Omit<DeviceSession, 'id' | 'userId' | 'isCurrent'> {
  if (typeof window === 'undefined') {
    return {
      deviceName: 'Unknown Device',
      browser: 'Web Browser',
      os: 'Unknown OS',
      deviceType: 'desktop',
      ipAddress: 'Localhost',
      location: 'العراق',
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }

  const userAgent = navigator.userAgent || '';
  const isElectron = Boolean((window as any).electronAPI) || /Electron/i.test(userAgent);
  const isCapacitor = Boolean((window as any).Capacitor?.isNativePlatform?.()) || /Capacitor|MobileApp/i.test(userAgent);

  // 1. Detect OS
  let os = 'Unknown OS';
  if (/Windows NT 10.0/i.test(userAgent)) os = 'Windows 11 / 10';
  else if (/Windows NT 6.3/i.test(userAgent)) os = 'Windows 8.1';
  else if (/Windows NT 6.1/i.test(userAgent)) os = 'Windows 7';
  else if (/Windows/i.test(userAgent)) os = 'Windows PC';
  else if (/iPhone/i.test(userAgent)) os = 'iOS (iPhone)';
  else if (/iPad/i.test(userAgent)) os = 'iPadOS';
  else if (/Macintosh|Mac OS X/i.test(userAgent)) os = 'macOS (Apple)';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/Linux/i.test(userAgent)) os = 'Linux';

  // 2. Detect Browser / Application Client (Electron & Native Apps MUST be evaluated before Chrome)
  let browser = 'Google Chrome';
  if (isElectron) {
    browser = 'IEH Desktop App (Electron)';
  } else if (isCapacitor) {
    browser = 'IEH Mobile App (Android)';
  } else if (/Edg\//i.test(userAgent)) {
    browser = 'Microsoft Edge';
  } else if (/OPR\//i.test(userAgent) || /Opera/i.test(userAgent)) {
    browser = 'Opera';
  } else if (/Brave/i.test(userAgent) || (navigator as any).brave) {
    browser = 'Brave';
  } else if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) {
    browser = 'Google Chrome';
  } else if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) {
    browser = 'Apple Safari';
  } else if (/Firefox\//i.test(userAgent)) {
    browser = 'Mozilla Firefox';
  }

  // 3. Detect Device Type
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/iPad|Tablet/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (/Mobi|iPhone|Android/i.test(userAgent) || isCapacitor) {
    deviceType = 'mobile';
  }

  // 4. Construct Descriptive Device Name
  let deviceName = `${os} • ${browser}`;
  if (isElectron) {
    deviceName = `تطبيق الحاسوب IEH (${os})`;
  } else if (isCapacitor) {
    deviceName = `تطبيق الهاتف IEH (${os})`;
  } else if (deviceType === 'mobile' && /iPhone/i.test(userAgent)) {
    deviceName = `iPhone • ${browser}`;
  } else if (deviceType === 'mobile' && /Android/i.test(userAgent)) {
    deviceName = `Android • ${browser}`;
  } else if (deviceType === 'desktop') {
    deviceName = `${os} (${browser})`;
  }

  return {
    deviceName,
    browser,
    os,
    deviceType,
    ipAddress: '185.193.xx.xx (ISP Iraq)',
    location: 'العراق',
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return 'server-dev-id';
  let deviceId = localStorage.getItem('ieh_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('ieh_device_id', deviceId);
  }
  return deviceId;
}

export function getActiveSessions(userId: string): DeviceSession[] {
  if (typeof window === 'undefined') return [];
  const currentDeviceId = getOrCreateDeviceId();
  const clientInfo = detectClientDevice();
  const storageKey = `ieh_sessions_${userId}`;

  let storedSessions: DeviceSession[] = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) storedSessions = JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse sessions:', e);
  }

  // Check if current device is already recorded
  const existingCurrentIndex = storedSessions.findIndex(s => s.id === currentDeviceId);
  if (existingCurrentIndex >= 0) {
    storedSessions[existingCurrentIndex].lastActive = new Date().toISOString();
    storedSessions[existingCurrentIndex].deviceName = clientInfo.deviceName;
    storedSessions[existingCurrentIndex].browser = clientInfo.browser;
    storedSessions[existingCurrentIndex].os = clientInfo.os;
    storedSessions[existingCurrentIndex].deviceType = clientInfo.deviceType;
  } else {
    // Add current device
    const currentSession: DeviceSession = {
      id: currentDeviceId,
      userId,
      ...clientInfo,
      lastActive: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      isCurrent: true,
    };
    storedSessions.unshift(currentSession);
  }

  // Update isCurrent flags
  const finalizedSessions = storedSessions.map(s => ({
    ...s,
    isCurrent: s.id === currentDeviceId,
  }));

  try {
    localStorage.setItem(storageKey, JSON.stringify(finalizedSessions));
  } catch (e) {}

  return finalizedSessions;
}

export async function syncRemoteSessions(userId: string): Promise<DeviceSession[]> {
  if (typeof window === 'undefined' || !userId) return [];
  const currentDeviceId = getOrCreateDeviceId();
  const clientInfo = detectClientDevice();
  const storageKey = `ieh_sessions_${userId}`;

  try {
    // 1. Upsert current device session to Supabase
    await supabase.from('user_device_sessions').upsert({
      id: currentDeviceId,
      user_id: userId,
      device_name: clientInfo.deviceName,
      browser: clientInfo.browser,
      os: clientInfo.os,
      device_type: clientInfo.deviceType,
      ip_address: clientInfo.ipAddress,
      location: clientInfo.location,
      last_active: new Date().toISOString(),
    });

    // 2. Fetch all sessions for this user from Supabase
    const { data: remoteSessions } = await supabase
      .from('user_device_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_active', { ascending: false });

    if (remoteSessions && remoteSessions.length > 0) {
      const mapped: DeviceSession[] = remoteSessions.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        deviceName: r.device_name,
        browser: r.browser,
        os: r.os,
        deviceType: r.device_type,
        ipAddress: r.ip_address,
        location: r.location,
        lastActive: r.last_active,
        createdAt: r.created_at,
        isCurrent: r.id === currentDeviceId,
      }));

      localStorage.setItem(storageKey, JSON.stringify(mapped));
      return mapped;
    }
  } catch (err) {
    console.warn('Could not sync remote sessions:', err);
  }

  return getActiveSessions(userId);
}

export function terminateSession(userId: string, sessionId: string): DeviceSession[] {
  if (typeof window === 'undefined') return [];
  const storageKey = `ieh_sessions_${userId}`;
  const sessions = getActiveSessions(userId);
  const remaining = sessions.filter(s => s.id !== sessionId);
  try {
    localStorage.setItem(storageKey, JSON.stringify(remaining));
  } catch (e) {}

  // Delete remote in background
  Promise.resolve(supabase.from('user_device_sessions').delete().eq('id', sessionId)).catch(() => {});

  return remaining;
}

export function terminateAllOtherSessions(userId: string): DeviceSession[] {
  if (typeof window === 'undefined') return [];
  const storageKey = `ieh_sessions_${userId}`;
  const currentDeviceId = getOrCreateDeviceId();
  const sessions = getActiveSessions(userId);
  const remaining = sessions.filter(s => s.id === currentDeviceId);
  try {
    localStorage.setItem(storageKey, JSON.stringify(remaining));
  } catch (e) {}

  // Delete all others from remote
  Promise.resolve(supabase.from('user_device_sessions').delete().eq('user_id', userId).neq('id', currentDeviceId)).catch(() => {});

  return remaining;
}
