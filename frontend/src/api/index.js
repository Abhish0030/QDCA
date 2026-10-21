import { DIFFICULTY_LEVELS, normalizeDifficulty } from '../utils/difficulty.js';
import { authClient } from '../lib/authClient.js';
import { apiBaseUrl } from '../lib/env.js';
import { requestJson } from '../lib/http.js';

const BASE = apiBaseUrl;
const AI_ACTION_TIMEOUT_MS = 90_000;
const CHATBOT_TIMEOUT_MS = 35_000;
const SIMILAR_QUESTIONS_TIMEOUT_MS = 35_000;
const PDF_UPLOAD_TIMEOUT_MS = 180_000;
const DEFAULT_CACHE_TTL_MS = 15_000;
const RESPONSE_CACHE = new Map();
const IN_FLIGHT_REQUESTS = new Map();

async function request(path, options = {}) {
  return requestJson(`${BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });
}

const get = path => request(path);

const post = (path, body, options = {}) =>
  request(path, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  });

const patch = (path, body) =>
  request(path, {
    method: 'PATCH',
    body: JSON.stringify(body ?? {}),
  });

const del = path =>
  request(path, {
    method: 'DELETE',
  });

export const NOTIFICATION_REFRESH_EVENT = 'qdca:notifications:refresh';
export const USER_ACTIVITY_REFRESH_EVENT = 'qdca:user-activity:refresh';
export const CHATBOT_OPEN_EVENT = 'qdca:chatbot:open';

function readCachedValue(key) {
  const cached = RESPONSE_CACHE.get(key);
  if (!cached || cached.expiresAt <= Date.now()) {
    RESPONSE_CACHE.delete(key);
    return null;
  }
  return cached.value;
}

function writeCachedValue(key, value, ttlMs = DEFAULT_CACHE_TTL_MS) {
  RESPONSE_CACHE.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

function clearCachedValues(prefixes = []) {
  if (!prefixes.length) {
    RESPONSE_CACHE.clear();
    IN_FLIGHT_REQUESTS.clear();
    return;
  }

  for (const key of RESPONSE_CACHE.keys()) {
    if (prefixes.some(prefix => key.startsWith(prefix))) {
      RESPONSE_CACHE.delete(key);
    }
  }
}

async function cachedGet(path, { ttlMs = DEFAULT_CACHE_TTL_MS, force = false } = {}) {
  const cacheKey = `GET:${path}`;

  if (!force) {
    const cached = readCachedValue(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  if (!force && IN_FLIGHT_REQUESTS.has(cacheKey)) {
    return IN_FLIGHT_REQUESTS.get(cacheKey);
  }

  const requestPromise = get(path)
    .then((value) => {
      writeCachedValue(cacheKey, value, ttlMs);
      return value;
    })
    .finally(() => {
      IN_FLIGHT_REQUESTS.delete(cacheKey);
    });

  IN_FLIGHT_REQUESTS.set(cacheKey, requestPromise);
  return requestPromise;
}

function dispatchWindowEvent(name) {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  window.dispatchEvent(new CustomEvent(name));
}

export async function updateProfileImage(image) {
  const { data, error } = await authClient.updateUser({ image: image || null });
  if (error) throw new Error(error.message || 'Could not update profile image');
  return data;
}

export async function fetchSettings() {
  const data = await cachedGet('/settings', { ttlMs: 30_000 });
  return data.data;
}

export async function updateSettingsProfile(payload) {
  const data = await request('/settings/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  dispatchWindowEvent(NOTIFICATION_REFRESH_EVENT);
  return data.data;
}

export async function uploadSettingsAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);
  const data = await request('/settings/avatar', {
    method: 'POST',
    body: formData,
  });
  dispatchWindowEvent(NOTIFICATION_REFRESH_EVENT);
  return data.data;
}

export async function deleteSettingsAvatar() {
  await del('/settings/avatar');
  dispatchWindowEvent(NOTIFICATION_REFRESH_EVENT);
}

export async function updateAiPreferences(payload) {
  const data = await request('/settings/ai-preferences', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  dispatchWindowEvent(NOTIFICATION_REFRESH_EVENT);
  return data.data;
}

export async function updateNotificationSettings(payload) {
  const data = await request('/settings/notifications', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  dispatchWindowEvent(NOTIFICATION_REFRESH_EVENT);
  return data.data;
}

export async function updatePrivacySettings(payload) {
  const data = await request('/settings/privacy', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  dispatchWindowEvent(NOTIFICATION_REFRESH_EVENT);
  return data.data;
}

export async function exportSettingsData() {
  const data = await post('/settings/export', {});
  dispatchWindowEvent(NOTIFICATION_REFRESH_EVENT);
  return data.data;
}

export async function clearSettingsData(target) {
  const data = await post('/settings/clear-data', { target });
  dispatchWindowEvent(NOTIFICATION_REFRESH_EVENT);
  return data.data;
}

export async function changeSettingsPassword(payload) {
  await post('/settings/security/change-password', payload);
  dispatchWindowEvent(NOTIFICATION_REFRESH_EVENT);
}

export async function fetchSecuritySessions() {
  const data = await cachedGet('/settings/security/sessions', { ttlMs: 20_000 });
  return data.data || [];
}

export async function logoutOtherDevices() {
  const data = await post('/settings/security/logout-others', {});
  dispatchWindowEvent(NOTIFICATION_REFRESH_EVENT);
  return data.data;
}

export async function updateRecoveryOptions(payload) {
  const data = await request('/settings/security/recovery', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  dispatchWindowEvent(NOTIFICATION_REFRESH_EVENT);
  return data.data;
}

export async function deactivateCurrentAccount() {
  await post('/settings/account/deactivate', {});
  dispatchWindowEvent(NOTIFICATION_REFRESH_EVENT);
}

export async function deleteCurrentAccount(payload) {
  await post('/settings/account/delete', payload);
}

function normalizeConfidence(value) {
  const numeric = Number(value ?? 0);
  return numeric <= 1 ? Math.round(numeric * 100) : Math.round(numeric);
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function mapQuestion(item) {
  return {
    id: item.id,
    question: item.title || item.content || 'Untitled question',
    source: 'Manual',
    difficulty: normalizeDifficulty(item.difficulty),
    conf: normalizeConfidence(item.confidence),
    date: formatDate(item.analyzedAt || item.createdAt),
  };
}

// Dashboard
export async function fetchStats() {
  const data = await cachedGet('/dashboard/summary');
  const total = Number(data.totalQuestions || 0);

  return {
    total,
    veryEasy: Number(data.veryEasyCount || 0),
    easy: Number(data.easyCount || 0),
    medium: Number(data.mediumCount || 0),
    hard: Number(data.hardCount || 0),
    expert: Number(data.expertCount || 0),
    users: Number(data.totalUsers || 0),
    accuracy: Number(data.averageConfidence || 0),
  };
}

export async function fetchPieChart() {
  const data = await cachedGet('/dashboard/difficulty-distribution');

  return DIFFICULTY_LEVELS.map(level => ({
    name: level.label,
    value: Number(data[level.key === 'very_easy' ? 'veryEasy' : level.key] || 0),
    color: level.color,
  }));
}

export async function fetchLineChart(range = 'This Week') {
  const rangeParam = {
    'This Week': 'week',
    'This Month': 'month',
    'This Year': 'year',
  }[range] || 'week';
  return cachedGet(`/dashboard/question-trend?range=${rangeParam}`);
}

export async function fetchClassifications({ force = false } = {}) {
  const data = await cachedGet('/questions?limit=50', { force });
  const items = Array.isArray(data) ? data : data.items || [];
  return items.map(mapQuestion);
}

export async function fetchUploads() {
  const data = await cachedGet('/uploads?limit=20');
  const items = Array.isArray(data.data) ? data.data : [];
  return items.map(item => ({
    id: item.id,
    name: item.name || 'Uploaded document',
    questions: Number(item.questions || 0),
    classifiedQuestions: Number(item.classifiedQuestions || 0),
    date: formatDate(item.date),
    status: item.status || 'Completed',
  }));
}

export async function fetchDashboardOverview() {
  return cachedGet('/dashboard/overview');
}

export async function fetchDashboardModelStatus() {
  return cachedGet('/dashboard/model-status');
}

export async function fetchPipelineContribution() {
  return cachedGet('/dashboard/pipeline-contribution');
}

export async function fetchProcessingPerformance() {
  return cachedGet('/dashboard/performance', { ttlMs: 10_000 });
}

export async function updateDashboardModelStatus(model) {
  const data = await patch('/dashboard/model-status', { model });
  clearCachedValues(['GET:/dashboard/']);
  return data.data;
}

export async function fetchActivity(limit = 20) {
  const data = await cachedGet(`/activity?limit=${limit}`, { ttlMs: 10_000 });
  return data.data || [];
}

export async function fetchLeaderboard(period = 'daily', limit = 20) {
  const data = await cachedGet(`/leaderboard?period=${encodeURIComponent(period)}&limit=${limit}`, {
    ttlMs: 20_000,
  });
  return data.data || { items: [], currentUser: null, updatedAt: null };
}

// Actions
export async function classifyQuestion(question, source = 'Manual', model = 'auto') {
  const data = await post('/classify', { question, model }, { timeoutMs: AI_ACTION_TIMEOUT_MS });

  clearCachedValues(['GET:/dashboard/', 'GET:/questions?limit=50', 'GET:/activity?', 'GET:/leaderboard?']);
  dispatchWindowEvent(NOTIFICATION_REFRESH_EVENT);
  dispatchWindowEvent(USER_ACTIVITY_REFRESH_EVENT);

  return {
    result: {
      question,
      source,
      difficulty: normalizeDifficulty(data.difficulty),
      conf: normalizeConfidence(data.confidence),
	  explanation: data.explanation,
	  reason: data.reason || data.explanation,
	  analysis: data.analysis,
	  estimatedStudentLevel: data.estimatedStudentLevel,
	  estimatedTime: data.estimatedTime,
	  skillsRequired: data.skillsRequired || [],
	  keyConcepts: data.keyConcepts || [],
	  model: data.model,
	  provider: data.provider,
	  actualModel: data.actualModel,
	  fallback: Boolean(data.fallback),
	  rag: data.rag || { available: false, grounded: false, status: 'unavailable', chunkCount: 0, sources: [], topSimilarity: null },
    },
  };
}

export async function generateQuestionAnswer(question, model = 'auto') {
  const data = await post('/classify/answer', { question, model }, { timeoutMs: AI_ACTION_TIMEOUT_MS });
  return data.data;
}

export async function streamQuestionAnswer(question, { model = 'auto', onEvent, signal } = {}) {
  const response = await fetch(`${BASE}/classify/answer/stream`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'text/event-stream',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, model }),
    signal,
  });

  if (!response.ok) {
    let message = `POST ${BASE}/classify/answer/stream failed: ${response.status}`;
    try {
      const data = await response.json();
      message = data?.message || message;
    } catch {
      // Ignore non-JSON stream failures.
    }
    throw new Error(message);
  }

  if (!response.body) {
    throw new Error('Answer stream did not return a readable body.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const eventBlock of events) {
      const lines = eventBlock.split('\n');
      const eventName = lines
        .find(line => line.startsWith('event:'))
        ?.slice(6)
        .trim();
      const dataLine = lines
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trim())
        .join('\n');

      if (!dataLine) continue;

      const payload = JSON.parse(dataLine);
      if (eventName === 'error') {
        throw new Error(payload?.message || 'Answer stream failed.');
      }

      onEvent?.(payload);
      if (payload?.type === 'result' && payload?.data) {
        finalResult = payload.data;
      }
    }
  }

  if (!finalResult) {
    throw new Error('Answer stream completed without a final result.');
  }

  return finalResult;
}

export async function changeQuestionDifficulty({
  question,
  originalDifficulty,
  newDifficulty,
  model = 'auto',
}) {
  const data = await post('/classify/change-difficulty', {
    question,
    originalDifficulty,
    newDifficulty,
    model,
  }, { timeoutMs: AI_ACTION_TIMEOUT_MS });
  return data.data;
}

export async function fetchSimilarQuestions(question) {
  const data = await post(
    '/questions/similar',
    { questionText: question },
    { timeoutMs: SIMILAR_QUESTIONS_TIMEOUT_MS },
  );
  return {
    matches: Array.isArray(data.data?.matches) ? data.data.matches : [],
    assistant: data.data?.assistant || {
      summary: '',
      suggestedQueries: [],
      detectedSubject: '',
      relatedTopics: [],
      model: null,
      fallback: true,
    },
  };
}

export async function uploadPDF(file) {
  const formData = new FormData();
  formData.append('file', file);
  const data = await request('/uploads/pdf', {
    method: 'POST',
    body: formData,
    timeoutMs: PDF_UPLOAD_TIMEOUT_MS,
  });
  clearCachedValues(['GET:/uploads?limit=20', 'GET:/dashboard/', 'GET:/activity?', 'GET:/leaderboard?']);
  dispatchWindowEvent(USER_ACTIVITY_REFRESH_EVENT);
  return data;
}

export async function fetchNotifications(limit = 20) {
  const data = await cachedGet(`/notifications?limit=${limit}`, { ttlMs: 10_000 });
  return data.data || { items: [], unreadCount: 0 };
}

export async function markNotificationsRead() {
  const data = await patch('/notifications/read-all');
  clearCachedValues(['GET:/notifications?']);
  return data.data || { items: [], unreadCount: 0 };
}

export async function dismissNotification(id) {
  await del(`/notifications/${encodeURIComponent(id)}`);
  clearCachedValues(['GET:/notifications?']);
}

export async function sendChatbotMessage(messages, options = {}) {
  const data = await request('/chatbot/message', {
    method: 'POST',
    body: JSON.stringify({ messages }),
    timeoutMs: CHATBOT_TIMEOUT_MS,
    ...options,
  });
  return data.data;
}

export function openChatbot() {
  dispatchWindowEvent(CHATBOT_OPEN_EVENT);
}

export async function fetchStudyRoadmap({ force = false } = {}) {
  const data = await cachedGet('/questions/study-roadmap', { ttlMs: 20_000, force });
  return data.data;
}
