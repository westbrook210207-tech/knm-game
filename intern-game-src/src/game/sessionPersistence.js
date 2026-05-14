const STORAGE_KEY = 'intern-game-session-v1';

export function loadPersistedSession() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed?.version === 1 ? parsed.state : null;
  } catch {
    return null;
  }
}

export function persistSession(state) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state,
      })
    );
  } catch {
    // Ignore persistence failures in demo mode.
  }
}

export function clearPersistedSession() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore cleanup failures in demo mode.
  }
}
