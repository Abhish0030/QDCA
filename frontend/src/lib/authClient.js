import { createAuthClient } from 'better-auth/react';
import { backendUrl } from './env.js';
import { fetchWithTimeout } from './http.js';

export const authClient = createAuthClient({
  baseURL: backendUrl,
  fetchOptions: {
    credentials: 'include',
  },
});

const AUTH_SESSION_URL = `${backendUrl}/api/auth/get-session`;
const AUTH_SESSION_TIMEOUT_MS = 4000;
const AUTH_SESSION_CACHE_KEY = 'qdca.auth.session';

export function cacheAuthenticatedSession(session) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (session?.user?.id) {
      window.sessionStorage.setItem(AUTH_SESSION_CACHE_KEY, JSON.stringify(session));
    } else {
      window.sessionStorage.removeItem(AUTH_SESSION_CACHE_KEY);
    }
  } catch {
    // Ignore storage access failures in restricted browser contexts.
  }
}

export function clearAuthenticatedSessionCache() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(AUTH_SESSION_CACHE_KEY);
  } catch {
    // Ignore storage access failures in restricted browser contexts.
  }
}

export function getCachedAuthenticatedSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawSession = window.sessionStorage.getItem(AUTH_SESSION_CACHE_KEY);
    if (!rawSession) {
      return null;
    }

    const session = JSON.parse(rawSession);
    return session?.user?.id ? session : null;
  } catch {
    return null;
  }
}

export async function getCurrentSession({ preserveCachedOnError = false } = {}) {
  const response = await fetchWithTimeout(AUTH_SESSION_URL, {
    credentials: 'include',
    timeoutMs: AUTH_SESSION_TIMEOUT_MS,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (!preserveCachedOnError) {
      clearAuthenticatedSessionCache();
    }
    throw new Error(data?.message || 'Could not verify the current session.');
  }

  cacheAuthenticatedSession(data);
  return data;
}

export async function waitForAuthenticatedSession({
  attempts = 8,
  delayMs = 200,
  preserveCachedOnError = false,
} = {}) {
  for (let index = 0; index < attempts; index += 1) {
    const session = await getCurrentSession({ preserveCachedOnError }).catch(() => null);

    if (session?.user?.id) {
      return session;
    }

    if (index < attempts - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }
  }

  if (!preserveCachedOnError) {
    clearAuthenticatedSessionCache();
  }
  return null;
}
