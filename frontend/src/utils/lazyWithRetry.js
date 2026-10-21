import { lazy } from "react";

function buildRetryKey(key) {
  return `qdca:lazy-retry:${key}`;
}

export function lazyWithRetry(factory, key) {
  return lazy(async () => {
    const retryKey = buildRetryKey(key);

    try {
      const module = await factory();
      window.sessionStorage?.removeItem(retryKey);
      return module;
    } catch (error) {
      const hasRetried = window.sessionStorage?.getItem(retryKey) === "1";

      if (!hasRetried) {
        window.sessionStorage?.setItem(retryKey, "1");
        window.location.reload();
        return new Promise(() => {});
      }

      window.sessionStorage?.removeItem(retryKey);
      throw error;
    }
  });
}
