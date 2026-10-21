const analyticsEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';

export function trackEvent(name, properties = {}) {
  const event = {
    name,
    properties,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  if (analyticsEnabled && window.dataLayer) {
    window.dataLayer.push(event);
    return;
  }

  if (import.meta.env.DEV) {
    console.info('[analytics]', event);
  }
}

export function trackError(error, context = {}) {
  const payload = {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    context,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  if (analyticsEnabled && window.dataLayer) {
    window.dataLayer.push({ name: 'app_error', properties: payload });
    return;
  }

  if (import.meta.env.DEV) {
    console.error('[app_error]', payload);
  }
}

export function initPerformanceMonitoring() {
  if (typeof PerformanceObserver === 'undefined') return;

  const observe = (type) => {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          trackEvent('web_vital', {
            name: entry.name,
            type: entry.entryType,
            value: entry.duration || entry.value || entry.startTime,
          });
        });
      });
      observer.observe({ type, buffered: true });
    } catch {
      // Some browsers do not support every performance entry type.
    }
  };

  ['largest-contentful-paint', 'layout-shift', 'first-input'].forEach(observe);
}
