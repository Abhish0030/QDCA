import { useEffect, useState } from "react";
import {
  dismissNotification as dismissNotificationRequest,
  fetchNotifications,
  markNotificationsRead as markNotificationsReadRequest,
  NOTIFICATION_REFRESH_EVENT,
} from "../api";

const INITIAL_STATE = {
  notifications: [],
  unreadCount: 0,
  loading: true,
  error: "",
};

let notificationState = { ...INITIAL_STATE };
let pollIntervalId = null;
let hasLoadedNotifications = false;
let inFlightNotificationsPromise = null;
const listeners = new Set();

function emitNotifications() {
  listeners.forEach((listener) => listener(notificationState));
}

function setNotificationState(nextState) {
  notificationState = nextState;
  emitNotifications();
}

async function loadNotifications({ silent = false } = {}) {
  if (inFlightNotificationsPromise) {
    return inFlightNotificationsPromise;
  }

  if (!silent) {
    setNotificationState({
      ...notificationState,
      loading: true,
    });
  }

  inFlightNotificationsPromise = fetchNotifications()
    .then((data) => {
      hasLoadedNotifications = true;
      setNotificationState({
        notifications: data.items || [],
        unreadCount: Number(data.unreadCount || 0),
        loading: false,
        error: "",
      });
      return data;
    })
    .catch(() => {
      hasLoadedNotifications = true;
      setNotificationState({
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: "Notifications unavailable",
      });
      return null;
    })
    .finally(() => {
      inFlightNotificationsPromise = null;
    });

  return inFlightNotificationsPromise;
}

function ensureNotificationPolling() {
  if (!hasLoadedNotifications) {
    void loadNotifications();
  }

  if (pollIntervalId) {
    return;
  }

  pollIntervalId = window.setInterval(refreshNotificationsListener, 15000);
  window.addEventListener(NOTIFICATION_REFRESH_EVENT, refreshNotificationsListener);
  window.addEventListener("focus", refreshNotificationsListener);
}

function cleanupNotificationPolling() {
  if (listeners.size > 0) {
    return;
  }

  if (pollIntervalId) {
    window.clearInterval(pollIntervalId);
    pollIntervalId = null;
  }

  window.removeEventListener(NOTIFICATION_REFRESH_EVENT, refreshNotificationsListener);
  window.removeEventListener("focus", refreshNotificationsListener);
}

function refreshNotificationsListener() {
  void loadNotifications({ silent: true });
}

export function useSharedNotifications() {
  const [state, setState] = useState(notificationState);

  useEffect(() => {
    listeners.add(setState);
    ensureNotificationPolling();
    setState(notificationState);

    return () => {
      listeners.delete(setState);
      cleanupNotificationPolling();
    };
  }, []);

  async function refreshNotifications() {
    await loadNotifications();
  }

  async function markAllRead() {
    const previousState = notificationState;
    setNotificationState({
      ...notificationState,
      notifications: notificationState.notifications.map((notification) => ({
        ...notification,
        unread: false,
      })),
      unreadCount: 0,
      error: "",
    });

    try {
      const data = await markNotificationsReadRequest();
      setNotificationState({
        notifications: data.items || [],
        unreadCount: Number(data.unreadCount || 0),
        loading: false,
        error: "",
      });
    } catch {
      setNotificationState({
        ...previousState,
        loading: false,
        error: "Could not mark notifications read",
      });
    }
  }

  async function dismissNotification(id) {
    const target = notificationState.notifications.find((notification) => notification.id === id);
    const previousState = notificationState;
    setNotificationState({
      ...notificationState,
      notifications: notificationState.notifications.filter((notification) => notification.id !== id),
      unreadCount: target?.unread
        ? Math.max(0, notificationState.unreadCount - 1)
        : notificationState.unreadCount,
      error: "",
    });

    try {
      await dismissNotificationRequest(id);
    } catch {
      setNotificationState({
        ...previousState,
        loading: false,
        error: "Could not dismiss notification",
      });
    }
  }

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loadingNotifications: state.loading,
    notificationError: state.error,
    refreshNotifications,
    markAllRead,
    dismissNotification,
  };
}
