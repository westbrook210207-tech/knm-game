const TEAM_CODE_STORAGE_KEY = 'knm-game.team-code';
const TEAM_SESSION_TOKEN_STORAGE_KEY = 'knm-game.team-session-token';

function canUseBrowserStorage() {
  return typeof window !== 'undefined';
}

export function createTeamSessionToken() {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `team-session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readStoredTeamSession() {
  if (!canUseBrowserStorage()) {
    return {
      teamCode: '',
      sessionToken: '',
    };
  }

  return {
    teamCode: window.localStorage.getItem(TEAM_CODE_STORAGE_KEY) || '',
    sessionToken: window.sessionStorage.getItem(TEAM_SESSION_TOKEN_STORAGE_KEY) || '',
  };
}

export function storeTeamSession({ teamCode, sessionToken }) {
  if (!canUseBrowserStorage()) return;

  if (teamCode) {
    window.localStorage.setItem(TEAM_CODE_STORAGE_KEY, teamCode);
  }

  if (sessionToken) {
    window.sessionStorage.setItem(TEAM_SESSION_TOKEN_STORAGE_KEY, sessionToken);
  }
}

export function clearStoredTeamSession() {
  if (!canUseBrowserStorage()) return;

  window.localStorage.removeItem(TEAM_CODE_STORAGE_KEY);
  window.sessionStorage.removeItem(TEAM_SESSION_TOKEN_STORAGE_KEY);
}

export function resetStoredTeamSessionToken(teamCode = '') {
  const nextToken = createTeamSessionToken();
  storeTeamSession({ teamCode, sessionToken: nextToken });
  return nextToken;
}

export function isInvalidTeamSessionError(error) {
  const message = error?.message || '';
  return message.includes('Invalid team session.');
}
