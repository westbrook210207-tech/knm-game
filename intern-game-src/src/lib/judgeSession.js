const JUDGE_CODE_STORAGE_KEY = 'knm-game.judge-code';
const JUDGE_SESSION_TOKEN_STORAGE_KEY = 'knm-game.judge-session-token';

function canUseBrowserStorage() {
  return typeof window !== 'undefined';
}

export function createJudgeSessionToken() {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `judge-session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function readStoredJudgeSession() {
  if (!canUseBrowserStorage()) {
    return {
      judgeCode: '',
      sessionToken: '',
    };
  }

  return {
    judgeCode: window.localStorage.getItem(JUDGE_CODE_STORAGE_KEY) || '',
    sessionToken: window.sessionStorage.getItem(JUDGE_SESSION_TOKEN_STORAGE_KEY) || '',
  };
}

export function storeJudgeSession({ judgeCode, sessionToken }) {
  if (!canUseBrowserStorage()) return;

  if (judgeCode) {
    window.localStorage.setItem(JUDGE_CODE_STORAGE_KEY, judgeCode);
  }

  if (sessionToken) {
    window.sessionStorage.setItem(JUDGE_SESSION_TOKEN_STORAGE_KEY, sessionToken);
  }
}

export function clearStoredJudgeSession() {
  if (!canUseBrowserStorage()) return;

  window.localStorage.removeItem(JUDGE_CODE_STORAGE_KEY);
  window.sessionStorage.removeItem(JUDGE_SESSION_TOKEN_STORAGE_KEY);
}

export function resetStoredJudgeSessionToken(judgeCode = '') {
  const nextToken = createJudgeSessionToken();
  storeJudgeSession({ judgeCode, sessionToken: nextToken });
  return nextToken;
}

export function isInvalidJudgeSessionError(error) {
  const message = error?.message || '';
  return message.includes('Invalid judge session.');
}
