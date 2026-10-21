/**
 * Admin API service layer.
 * All functions use the same fetch wrapper pattern as src/api.js.
 *
 * Base: ${apiBaseUrl}/admin
 */
import { apiBaseUrl } from "../lib/env.js";
import { requestJson } from "../lib/http.js";

const BASE = `${apiBaseUrl}/admin`;
const APP_BASE = apiBaseUrl.endsWith("/api") ? apiBaseUrl.slice(0, -4) : apiBaseUrl;

async function get(path) {
  return requestJson(`${BASE}${path}`, { credentials: 'include' });
}

async function post(path, body) {
  return requestJson(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
}

async function patch(path, body) {
  return requestJson(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
}

async function del(path) {
  return requestJson(`${BASE}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
/**
 * GET /api/admin/stats
 * Response: {
 *   totalUsers: number, totalQuestions: number, totalUploads: number,
 *   activeToday: number, modelAccuracy: number
 * }
 */
export const fetchAdminStats = () => get('/stats');

export const verifyAdminAccess = () => get('/access');

/**
 * GET /api/admin/activity?range=week|month|year
 * Response: [{ date: string, value: number }]
 */
export const fetchAdminActivity = (range = 'week') => get(`/activity?range=${range}`);

/**
 * GET /api/admin/difficulty-distribution
 * Response: [{ name: string, value: number, color: string }]
 */
export const fetchAdminDifficulty = () => get('/difficulty-distribution');

/**
 * GET /api/admin/recent-signups
 * Response: [{ id, name, email, role, joinedAt, avatarInitial }]
 */
export const fetchRecentSignups = () => get('/recent-signups');

/**
 * GET /api/admin/recent-actions
 * Response: [{ id, adminName, action, targetUser, timestamp }]
 */
export const fetchRecentActions = () => get('/recent-actions');

// ─── Users ────────────────────────────────────────────────────────────────────
/**
 * GET /api/admin/users?search=&role=&status=&page=1&limit=10
 * Response: { users: [...], total: number, page: number, totalPages: number }
 * User shape: { id, name, email, role, status, joinedAt, lastActive, avatarInitial }
 */
export const fetchUsers = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/users${q ? `?${q}` : ''}`);
};

/**
 * GET /api/admin/users/:id
 * Response: { user, stats: { questions, accuracy, uploads, accountStatus } }
 */
export const fetchUser = (id) => get(`/users/${id}`);

/**
 * PATCH /api/admin/users/:id/role
 * Body: { role: 'admin' | 'user' }
 * Response: { success: boolean, user }
 */
export const updateUserRole = (id, role) => patch(`/users/${id}/role`, { role });

/**
 * PATCH /api/admin/users/:id/status
 * Body: { status: 'active' | 'suspended' }
 * Response: { success: boolean, user }
 */
export const updateUserStatus = (id, status) => patch(`/users/${id}/status`, { status });

/**
 * DELETE /api/admin/users/:id
 * Response: { success: boolean }
 */
export const deleteUser = (id) => del(`/users/${id}`);

// ─── Questions ────────────────────────────────────────────────────────────────
/**
 * GET /api/admin/questions?filter=all|easy|medium|hard|flagged&page=1&limit=20
 * Response: { questions: [...], total: number }
 * Question shape: { id, text, difficulty, confidence, submittedBy, date, flagged }
 */
export const fetchAdminQuestions = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/questions${q ? `?${q}` : ''}`);
};

/**
 * PATCH /api/admin/questions/:id/override
 * Body: { difficulty: 'Easy' | 'Medium' | 'Hard' }
 * Response: { success: boolean, question }
 */
export const overrideQuestionDifficulty = (id, difficulty) =>
  patch(`/questions/${id}/override`, { difficulty });

// ─── Uploads ──────────────────────────────────────────────────────────────────
/**
 * GET /api/admin/uploads?page=1&limit=20
 * Response: { uploads: [...], total: number }
 * Upload shape: {
 *   id, filename, uploadedBy, date, questionsExtracted, questionsClassified,
 *   indexedChunks, status, errorMessage, warningMessage, retryAvailable, attemptCount
 * }
 */
export const fetchAdminUploads = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/uploads${q ? `?${q}` : ''}`);
};

/**
 * POST /api/admin/uploads/:id/retry
 * Response: { success: boolean, upload }
 */
export const retryUpload = (id) => post(`/uploads/${id}/retry`, {});

// ─── Analytics ────────────────────────────────────────────────────────────────
/**
 * GET /api/admin/analytics
 * Response: {
 *   difficultyBySubject: [{ subject, easy, medium, hard }],
 *   userGrowth: [{ date, count }],
 *   confidenceTrend: [{ date, avg }],
 *   peakHours: [{ hour, count }]
 * }
 */
export const fetchAdminAnalytics = () => get('/analytics');

/**
 * GET /api/admin/audit-logs?search=&category=&page=1&limit=10
 */
export const fetchAdminAuditLogs = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return get(`/audit-logs${q ? `?${q}` : ''}`);
};

/**
 * GET /api/admin/ai-monitoring
 */
export const fetchAdminAiMonitoring = () => get('/ai-monitoring');

/**
 * GET /api/health
 */
export const fetchAdminSystemHealth = () =>
  requestJson(`${APP_BASE}/api/health`, { credentials: 'include' });

// ─── Settings ─────────────────────────────────────────────────────────────────
/**
 * GET /api/admin/settings
 * Response: {
 *   aiModel: string, confidenceThreshold: number,
 *   maintenanceMode: boolean, signupsEnabled: boolean
 * }
 */
export const fetchAdminSettings = () => get('/settings');

/**
 * PATCH /api/admin/settings
 * Body: Partial<Settings>
 * Response: { success: boolean, settings }
 */
export const updateAdminSettings = (settings) => patch('/settings', settings);
