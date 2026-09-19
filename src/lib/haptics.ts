/**
 * Iraq Esports Hub — Tactile Micro-Haptics Engine
 * Provides subtle, high-grade haptic pulses for mobile devices.
 */

export type HapticType = 'light' | 'medium' | 'success' | 'scrimMatch' | 'warning';

const HAPTIC_STORAGE_KEY = 'ieh_haptics_enabled';

export function isHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(HAPTIC_STORAGE_KEY) !== 'false';
}

export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HAPTIC_STORAGE_KEY, enabled ? 'true' : 'false');
}

export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (!isHapticsEnabled()) return;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      switch (type) {
        case 'light':
          // 40ms crisp tactile pulse (overcomes motor spin-up inertia & OS dampening)
          navigator.vibrate(40);
          break;
        case 'medium':
          // 60ms solid tactile pulse (Tab switches, firm toggles)
          navigator.vibrate(60);
          break;
        case 'success':
          // Distinct dual-beat pulse: [40ms buzz, 60ms gap, 40ms buzz]
          navigator.vibrate([40, 60, 40]);
          break;
        case 'scrimMatch':
          // Urgent tactical alert: [50ms buzz, 60ms gap, 50ms buzz, 60ms gap, 50ms buzz]
          navigator.vibrate([50, 60, 50, 60, 50]);
          break;
        case 'warning':
          // Heavy alert staccato: [70ms buzz, 50ms gap, 70ms buzz]
          navigator.vibrate([70, 50, 70]);
          break;
        default:
          navigator.vibrate(40);
      }
    }
  } catch {
    // Fail silently on non-mobile or unsupported environments
  }
}
