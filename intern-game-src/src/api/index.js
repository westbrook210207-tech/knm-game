import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Game Session ──────────────────────────────────────────────
export const getSession = (sessionId) =>
  api.get(`/session/${sessionId}`).then((r) => r.data);

export const createSession = (payload) =>
  api.post('/session', payload).then((r) => r.data);

// ── Round 1 ───────────────────────────────────────────────────
export const getRound1Question = (sessionId, questionIndex) =>
  api.get(`/round1/${sessionId}/question/${questionIndex}`).then((r) => r.data);

export const submitRound1Answer = (sessionId, payload) =>
  api.post(`/round1/${sessionId}/answer`, payload).then((r) => r.data);
// payload: { teamId, questionIndex, answer, bet }

export const getRound1Results = (sessionId) =>
  api.get(`/round1/${sessionId}/results`).then((r) => r.data);

// ── Round 2 ───────────────────────────────────────────────────
export const getRound2Scenario = (sessionId, teamId) =>
  api.get(`/round2/${sessionId}/scenario/${teamId}`).then((r) => r.data);

export const submitRound2SWOT = (sessionId, payload) =>
  api.post(`/round2/${sessionId}/submit`, payload).then((r) => r.data);
// payload: { teamId, strengths, weaknesses, opportunities, threats }

export const getRound2Scores = (sessionId) =>
  api.get(`/round2/${sessionId}/scores`).then((r) => r.data);

// ── Bonus Round ───────────────────────────────────────────────
export const submitBonusResult = (sessionId, payload) =>
  api.post(`/bonus/${sessionId}/submit`, payload).then((r) => r.data);
// payload: { teamId, completed }

// ── Leaderboard ───────────────────────────────────────────────
export const getLeaderboard = (sessionId) =>
  api.get(`/leaderboard/${sessionId}`).then((r) => r.data);

export default api;
