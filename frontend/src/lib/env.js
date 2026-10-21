const viteEnv = import.meta.env ?? {};

function stripTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function isLocalDevHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isLocalAppPort(port) {
  return Boolean(port) && port !== '3000';
}

function inferBackendUrl() {
  if (viteEnv.VITE_BACKEND_URL) {
    return viteEnv.VITE_BACKEND_URL;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:3000';
  }

  const { hostname, origin, port, protocol } = window.location;

  if (isLocalDevHost(hostname) && isLocalAppPort(port)) {
    return `${protocol}//${hostname}:3000`;
  }

  return origin;
}

function inferAppUrl() {
  if (typeof window !== 'undefined') {
    const { hostname, origin, port } = window.location;

    if (isLocalDevHost(hostname) && isLocalAppPort(port)) {
      return origin;
    }
  }

  if (viteEnv.VITE_APP_URL) {
    return viteEnv.VITE_APP_URL;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:5173';
}

function inferApiBaseUrl() {
  if (viteEnv.VITE_API_BASE_URL) {
    return viteEnv.VITE_API_BASE_URL;
  }

  return `${inferBackendUrl()}/api`;
}

function inferAuthBaseUrl() {
  if (viteEnv.VITE_AUTH_BASE_URL) {
    return viteEnv.VITE_AUTH_BASE_URL;
  }

  return inferBackendUrl();
}

const inferredBackendUrl = inferBackendUrl();
const inferredAppUrl = inferAppUrl();
const inferredApiBaseUrl = inferApiBaseUrl();
const inferredAuthBaseUrl = inferAuthBaseUrl();

export const backendUrl = stripTrailingSlash(inferredBackendUrl);
export const appUrl = stripTrailingSlash(inferredAppUrl);
export const apiBaseUrl = stripTrailingSlash(inferredApiBaseUrl);
export const authBaseUrl = stripTrailingSlash(inferredAuthBaseUrl);
