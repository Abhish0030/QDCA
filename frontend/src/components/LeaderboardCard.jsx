import { useEffect, useState } from "react";
import { Trophy, Flame, Medal } from "lucide-react";
import { authClient } from "../lib/authClient";
import { fetchLeaderboard, USER_ACTIVITY_REFRESH_EVENT } from "../api";
import UserAvatar from "./UserAvatar";
import { formatRelativeTime } from "../utils/time";

const TOP_CARD_STYLES = [
  "border-yellow-200 bg-gradient-to-br from-yellow-50 to-white",
  "border-slate-200 bg-gradient-to-br from-slate-50 to-white",
  "border-orange-200 bg-gradient-to-br from-orange-50 to-white",
];

export default function LeaderboardCard({ limit = 20, refreshKey = 0 }) {
  const { data: session } = authClient.useSession();
  const [data, setData] = useState({ items: [], currentUser: null, updatedAt: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      setLoading(true);
      setError("");
      try {
        const response = await fetchLeaderboard("daily", limit);
        if (!active) return;
        setData({
          items: Array.isArray(response.items) ? response.items : [],
          currentUser: response.currentUser || null,
          updatedAt: response.updatedAt || new Date().toISOString(),
        });
      } catch {
        if (!active) return;
        setData({ items: [], currentUser: null, updatedAt: null });
        setError("Leaderboard unavailable");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadLeaderboard();
    window.addEventListener(USER_ACTIVITY_REFRESH_EVENT, loadLeaderboard);

    return () => {
      active = false;
      window.removeEventListener(USER_ACTIVITY_REFRESH_EVENT, loadLeaderboard);
    };
  }, [limit, refreshKey]);

  const topThree = data.items.slice(0, 3);
  const currentUserId = session?.user?.id;
  const currentUserInList = data.items.some(item => item.userId === currentUserId);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-5 py-5 border-b border-gray-50">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Top contributors based on Daily Streak</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              {data.updatedAt ? `Updated ${formatRelativeTime(data.updatedAt)}` : "Updated just now"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {loading ? (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-gray-100 p-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-gray-100" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-gray-100" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-gray-100" />
                  <div className="mt-4 h-8 w-full rounded bg-gray-100" />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-gray-100 shrink-0" />
                  <div className="h-10 w-10 rounded-full bg-gray-100 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-gray-100" />
                    <div className="h-3 w-56 rounded bg-gray-100" />
                  </div>
                  <div className="h-8 w-24 rounded bg-gray-100 shrink-0" />
                </div>
              ))}
            </div>
          </>
        ) : error ? (
          <div className="py-10 text-center text-sm text-gray-400">{error}</div>
        ) : data.items.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No leaderboard data yet</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {topThree.map((entry, index) => (
                <div key={entry.userId} className={`rounded-2xl border p-4 ${TOP_CARD_STYLES[index] || TOP_CARD_STYLES[2]}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-700 shadow-sm">
                      #{entry.rank}
                    </span>
                    <Medal className={`w-4 h-4 ${index === 0 ? "text-yellow-500" : index === 1 ? "text-slate-400" : "text-orange-400"}`} />
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <UserAvatar
                      image={entry.avatar}
                      name={entry.name}
                      className="w-12 h-12 rounded-full shrink-0"
                      fallbackClassName="text-base"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{entry.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {entry.questionsClassified} questions classified
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MetricPill icon={<Flame className="w-3.5 h-3.5 text-orange-500" />} label={`${entry.currentStreak} day streak`} />
                    <MetricPill label={`${entry.points} pts`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {data.items.map(entry => {
                const isCurrentUser = entry.userId === currentUserId;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                      isCurrentUser
                        ? "border-purple-200 bg-purple-50/70"
                        : "border-transparent bg-gray-50/50 hover:bg-purple-50/30"
                    }`}
                  >
                    <div className="w-8 text-sm font-bold text-gray-400 shrink-0">#{entry.rank}</div>
                    <UserAvatar
                      image={entry.avatar}
                      name={entry.name}
                      className="w-10 h-10 rounded-full shrink-0"
                      fallbackClassName="text-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{entry.name}</p>
                        {isCurrentUser && (
                          <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">
                            You
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400 truncate">
                        {entry.questionsClassified} classified • {entry.lastActivity ? formatRelativeTime(entry.lastActivity) : "No recent activity"}
                      </p>
                    </div>
                    <div className="grid shrink-0 grid-cols-2 gap-2 text-right sm:min-w-[180px]">
                      <MetricStack label="Streak" value={`${entry.currentStreak}d`} />
                      <MetricStack label="Points" value={entry.points.toLocaleString()} />
                    </div>
                  </div>
                );
              })}

              {!currentUserInList && data.currentUser && (
                <div className="mt-3 rounded-2xl border border-purple-200 bg-purple-50/70 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-purple-500">Your rank</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="w-8 text-sm font-bold text-gray-400 shrink-0">#{data.currentUser.rank}</div>
                    <UserAvatar
                      image={data.currentUser.avatar}
                      name={data.currentUser.name}
                      className="w-10 h-10 rounded-full shrink-0"
                      fallbackClassName="text-sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{data.currentUser.name}</p>
                      <p className="mt-0.5 text-xs text-gray-400 truncate">
                        {data.currentUser.questionsClassified} classified • {data.currentUser.currentStreak} day streak
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{data.currentUser.points} pts</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricPill({ icon = null, label }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-gray-600 shadow-sm">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function MetricStack({ label, value }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}
