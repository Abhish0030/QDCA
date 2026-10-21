export const HTTP_REQUEST_TIMEOUT_MS = 10000;

function buildTimeoutError(timeoutMs) {
  return new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
}

export async function fetchWithTimeout(url, options = {}) {
  const timeoutMs = options.timeoutMs ?? HTTP_REQUEST_TIMEOUT_MS;
  const externalSignal = options.signal;
  const controller = new AbortController();
  let timeoutId = null;
  const timers = globalThis;

  function abortRequest() {
    controller.abort(buildTimeoutError(timeoutMs));
  }

  if (timeoutMs > 0) {
    timeoutId = timers.setTimeout(abortRequest, timeoutMs);
  }

  if (externalSignal) {
    if (externalSignal.aborted) {
      abortRequest();
    } else {
      externalSignal.addEventListener("abort", abortRequest, { once: true });
    }
  }

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw controller.signal.reason instanceof Error
        ? controller.signal.reason
        : buildTimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    if (timeoutId) {
      timers.clearTimeout(timeoutId);
    }
  }
}

export async function requestJson(url, options = {}) {
  const response = await fetchWithTimeout(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      `${options.method || "GET"} ${url} failed: ${response.status}`,
    );
  }

  return data;
}
