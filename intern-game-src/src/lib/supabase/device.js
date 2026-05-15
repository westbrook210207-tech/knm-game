const DEVICE_FINGERPRINT_KEY = 'phase004-device-fingerprint';

function createFingerprint() {
  return window.crypto?.randomUUID?.() || `device-${Date.now()}`;
}

export function getDeviceFingerprint() {
  if (typeof window === 'undefined') return 'server-render';

  const stored = window.localStorage.getItem(DEVICE_FINGERPRINT_KEY);
  if (stored) return stored;

  const next = createFingerprint();
  window.localStorage.setItem(DEVICE_FINGERPRINT_KEY, next);
  return next;
}

export function resetDeviceFingerprint() {
  if (typeof window === 'undefined') return 'server-render';

  const next = createFingerprint();
  window.localStorage.setItem(DEVICE_FINGERPRINT_KEY, next);
  return next;
}

export function getDeviceLabel() {
  if (typeof window === 'undefined') return 'unknown-device';

  const width = window.innerWidth || 0;
  const formFactor = width > 900 ? 'desktop' : 'mobile';
  const platform = window.navigator?.platform || 'browser';

  return `${formFactor}:${platform}`;
}
