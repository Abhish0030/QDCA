import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { fetchActivity, USER_ACTIVITY_REFRESH_EVENT } from "../api";
import UserAvatar from "./UserAvatar";
import { formatRelativeTime } from "../utils/time";
import DashboardEmptyState from "./DashboardEmptyState";
import { readSessionCache, writeSessionCache } from "../utils/cache";

export default function ActivityFeedCard({ limit = 5, showViewAll = true, fullHeight = false, refreshKey = 0, onPrimaryAction }) {
  const cacheKey = `qdca:dashboard:activity:${limit}`;
  const cachedItems = readSessionCache(cacheKey) || [];
  const [items, setItems] = useState(() => cachedItems);
  const [loading, setLoading] = useState(() => !cachedItems.length);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadActivity() {
      setError("");
      try {
        const data = await fetchActivity(limit);
        if (!active) return;
        const normalizedItems = Array.isArray(data) ? data : [];
        setItems(normalizedItems);
        writeSessionCache(cacheKey, normalizedItems);
      } catch {
        if (!active) return;
        const fallbackItems = readSessionCache(cacheKey) || [];
        setItems(fallbackItems);
        if (!fallbackItems.length) {
          setError("Activity unavailable");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadActivity();
    window.addEventListener(USER_ACTIVITY_REFRESH_EVENT, loadActivity);

    return () => {
      active = false;
      window.removeEventListener(USER_ACTIVITY_REFRESH_EVENT, loadActivity);
    };
  }, [cacheKey, limit, refreshKey]);

  const safeItems = Array.isArray(items)
    ? items
        .filter(item => item && typeof item === "object")
        .map((item, index) => {
          const safeUser = item.user && typeof item.user === "object" ? item.user : {};
          const safeTimestamp = typeof item.timestamp === "string" || item.timestamp instanceof Date
            ? item.timestamp
            : "";
          const safeDescription = typeof item.description === "string" && item.description.trim()
            ? item.description
            : "Recent activity";
          const safeQuestionsClassified = Number(item.questionsClassified ?? 0);

          return {
            id: item.id || `${safeUser.id || "activity"}-${index}`,
            actionType: typeof item.actionType === "string" ? item.actionType : "",
            description: safeDescription,
            timestamp: safeTimestamp,
            questionsClassified: Number.isFinite(safeQuestionsClassified) ? safeQuestionsClassified : 0,
            user: {
              id: safeUser.id || "",
              name: safeUser.name || safeUser.initials || "Unknown user",
              avatar: safeUser.avatar || null,
              initials: safeUser.initials || "U",
            },
          };
        })
    : [];

  const groupedItems = aggregateActivityByUser(safeItems, limit);

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm ${fullHeight ? "h-full" : ""}`}>
      <div className="border-b border-gray-50 px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-100">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Activity</h3>
            <p className="mt-1 text-sm text-gray-400">Recent actions across all users</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-1">
        {loading ? (
          Array.from({ length: Math.min(limit, 5) }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 py-4">
              <div className="h-10 w-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-4 rounded bg-gray-100 animate-pulse w-40" />
                <div className="h-3 rounded bg-gray-100 animate-pulse w-56 max-w-full" />
              </div>
              <div className="h-4 rounded bg-gray-100 animate-pulse w-16 shrink-0" />
            </div>
          ))
        ) : error ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">{error}</div>
        ) : groupedItems.length === 0 ? (
          <DashboardEmptyState onAction={onPrimaryAction} />
        ) : (
          groupedItems.map(item => (
            <div key={item.id} className="flex items-center gap-4 border-b border-gray-50 py-4 last:border-0">
              <UserAvatar
                image={item.user.avatar}
                name={item.user.name}
                className="h-10 w-10 rounded-full shrink-0"
                fallbackClassName="text-sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {item.user.name}
                </p>
                <div className="mt-1 flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                  <p className="truncate text-sm leading-6 text-gray-500">
                    {item.questionsClassified > 0
                      ? `Classified ${item.questionsClassified} question${item.questionsClassified === 1 ? "" : "s"}`
                      : item.description}
                  </p>
                  <span className="hidden sm:inline text-[10px] uppercase tracking-wide text-gray-300">•</span>
                  <p className="text-sm text-gray-400 truncate">{formatRelativeTime(item.timestamp)}</p>
                </div>
              </div>
              <div className="min-w-[48px] shrink-0 text-right">
                <p className="text-lg font-extrabold text-gray-900">
                  {item.questionsClassified}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {showViewAll && (
        <div className="border-t border-gray-50 px-6 py-4 text-center">
          <Link
            to="/activity"
            className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
          >
            View full activity
          </Link>
        </div>
      )}
    </div>
  );
}

function aggregateActivityByUser(items, limit) {
  const grouped = new Map();

  for (const item of items) {
    const userKey = item.user.id || item.user.name || item.id;
    const existing = grouped.get(userKey);

    if (!existing) {
      grouped.set(userKey, {
        ...item,
        questionsClassified: Math.max(0, Number(item.questionsClassified || 0)),
      });
      continue;
    }

    const existingTime = Date.parse(existing.timestamp || "") || 0;
    const nextTime = Date.parse(item.timestamp || "") || 0;
    const latestItem = nextTime > existingTime ? item : existing;

    grouped.set(userKey, {
      ...existing,
      ...latestItem,
      user: existing.user,
      questionsClassified:
        Math.max(0, Number(existing.questionsClassified || 0)) +
        Math.max(0, Number(item.questionsClassified || 0)),
    });
  }

  return [...grouped.values()]
    .sort((left, right) => (Date.parse(right.timestamp || "") || 0) - (Date.parse(left.timestamp || "") || 0))
    .slice(0, limit);
}
