const DEFAULT_TTL_MS = 5 * 60 * 1000;
const CACHE_VERSION = "v3";
const VERSIONED_PREFIX = `qdca:${CACHE_VERSION}:`;

function getSessionStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function toVersionedKey(key) {
  if (String(key).startsWith(VERSIONED_PREFIX)) {
    return key;
  }

  return `${VERSIONED_PREFIX}${key}`;
}

export function readSessionCache(key, ttlMs = DEFAULT_TTL_MS) {
  const storage = getSessionStorage();
  if (!storage) return null;

  try {
    const versionedKey = toVersionedKey(key);
    const raw = storage.getItem(versionedKey);

    if (!raw) {
      storage.removeItem(key);
      return null;
    }


    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.timestamp !== "number") return null;
    if (Date.now() - parsed.timestamp > ttlMs) return null;

    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export function writeSessionCache(key, data) {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    const versionedKey = toVersionedKey(key);
    storage.removeItem(key);
    storage.setItem(versionedKey, JSON.stringify({
      timestamp: Date.now(),
      data,
    }));
  } catch {
    // Ignore cache write failures.
  }
}

export function clearSessionCache(prefix = "") {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    const keysToRemove = [];
    for (let index = 0; index < storage.length; index += 1) {
      const currentKey = storage.key(index);
      if (!currentKey) continue;

      const matchesLegacy = currentKey.startsWith(prefix);
      const matchesVersioned = currentKey.startsWith(`${VERSIONED_PREFIX}${prefix}`);

      if (matchesLegacy || matchesVersioned) {
        keysToRemove.push(currentKey);
      }
    }

    keysToRemove.forEach((keyToRemove) => storage.removeItem(keyToRemove));
  } catch {
    // Ignore cache clear failures.
  }
}
