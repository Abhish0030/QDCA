import { useState, useRef, useEffect } from "react";
import {
  Bell, Plus, Upload, Download, Menu, X,
  CheckCircle2, FileText, Brain, Settings, Shield,
} from "lucide-react";
import { useSharedNotifications } from "../hooks/useSharedNotifications";
import { formatRelativeTime } from "../utils/time";

const NOTIFICATION_ICON_STYLES = {
  classification_complete: {
    icon: Brain,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  pdf_uploaded: {
    icon: FileText,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  report_ready: {
    icon: CheckCircle2,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  profile_updated: {
    icon: Settings,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  settings_updated: {
    icon: Settings,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  security_alert: {
    icon: Shield,
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  default: {
    icon: Bell,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-500",
  },
};

function useOutsideClick(ref, onClose) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

export default function Header({ onMenuClick, onClassify, onUploadPDF, userName, subtitle, primaryLabel, primaryAction, secondaryLabel, secondaryAction }) {
  const [notifOpen,     setNotifOpen]     = useState(false);
  const {
    notifications,
    unreadCount,
    loadingNotifications,
    notificationError,
    refreshNotifications,
    markAllRead,
    dismissNotification,
  } = useSharedNotifications();

  const notifRef = useRef(null);
  useOutsideClick(notifRef, () => setNotifOpen(false));

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-gray-100 bg-white px-4 py-3 sm:px-5 md:px-6 md:py-4">
      {/* Hamburger */}
      <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors" onClick={onMenuClick} aria-label="Open menu">
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Title */}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-bold leading-tight text-gray-900 sm:text-[1.05rem] md:text-[1.15rem] xl:text-[1.2rem]">Welcome back, {userName || "there"}! 👋</h1>
        <p className="mt-1 hidden text-sm leading-6 text-gray-500 sm:block">
          {subtitle || "Here's an overview of your question classification performance."}
        </p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        {/* Analyze — shown only when onClassify is provided (user dashboard) */}
        {onClassify && (
          <button
            onClick={onClassify}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-purple-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 transition-all hover:bg-purple-700 sm:min-h-[50px] sm:px-5 sm:py-3 sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Analyze New Question</span>
            <span className="lg:hidden">Analyze</span>
          </button>
        )}

        {/* Upload PDF — shown only when onUploadPDF is provided (user dashboard) */}
        {onUploadPDF && (
          <button
            onClick={onUploadPDF}
            className="hidden min-h-[44px] items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:flex sm:min-h-[50px] sm:px-5 sm:py-3 sm:text-base"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden lg:inline">Upload PDF</span>
            <span className="lg:hidden">Upload</span>
          </button>
        )}

        {/* Admin secondary action button */}
        {secondaryLabel && (
          <button
            onClick={secondaryAction}
            className="hidden min-h-[44px] items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:flex sm:min-h-[50px] sm:px-5 sm:py-3 sm:text-base"
          >
            <Download className="w-4 h-4" />
            {secondaryLabel}
          </button>
        )}

        {/* Admin primary action button */}
        {primaryLabel && (
          <button
            onClick={primaryAction}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-purple-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 transition-all hover:bg-purple-700 sm:min-h-[50px] sm:px-5 sm:py-3 sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">{primaryLabel}</span>
            <span className="lg:hidden">Add</span>
          </button>
        )}

        {/* ── Notifications ──────────────────────────────── */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(v => !v)} className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <Bell className="w-4 h-4 text-gray-500" />
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center pointer-events-none">
              {unreadCount}
            </span>
          )}

          {notifOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-50 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-[-0.01em] text-gray-800">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors">
                    Mark all read
                  </button>
                )}
              </div>

              {loadingNotifications ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm text-gray-400">Loading notifications</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{notificationError || "No notifications"}</p>
                </div>
              ) : (
                <div className="max-h-72 divide-y divide-gray-50 overflow-y-auto">
                  {notifications.map(n => {
                    const style = NOTIFICATION_ICON_STYLES[n.type] || NOTIFICATION_ICON_STYLES.default;
                    const Icon = style.icon;
                    return (
                      <div
                        key={n.id}
                        className={`group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${n.unread ? "bg-purple-50/40" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${style.iconBg}`}>
                          <Icon className={`w-4 h-4 ${style.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-gray-800 truncate">{n.title}</p>
                            {n.unread && <span className="w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0" />}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-gray-500 line-clamp-2">{n.message}</p>
                          <p className="mt-1 text-[10px] font-medium text-gray-300">{formatRelativeTime(n.createdAt)}</p>
                        </div>
                        <button
                          onClick={() => dismissNotification(n.id)}
                          className="mt-0.5 shrink-0 rounded-lg p-1 opacity-0 transition-all group-hover:opacity-100 hover:bg-gray-200"
                        >
                          <X className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-50 text-center">
                  <button
                    onClick={refreshNotifications}
                    className="text-xs font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Refresh notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>


      </div>
    </header>
  );
}
