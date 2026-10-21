import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, FileText, Upload, UserPlus, Users, Brain } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import StatCard from "../../../components/StatCard.jsx";
import { fetchAdminActivity, fetchAdminDifficulty, fetchAdminStats, fetchRecentSignups } from "../../../api/adminApi.js";
import AdminEmptyState from "../components/AdminEmptyState.jsx";
import { AdminPageError, AdminPageLoading } from "../components/AdminPageState.jsx";

const STAT_ICONS = [Users, FileText, Upload, Activity, Brain];
const STAT_STYLES = [
  { iconBg: "bg-rose-100", iconColor: "text-rose-600" },
  { iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { iconBg: "bg-yellow-100", iconColor: "text-yellow-600" },
  { iconBg: "bg-green-100", iconColor: "text-green-600" },
  { iconBg: "bg-orange-100", iconColor: "text-orange-600" },
];
const RANGE_OPTIONS = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Year", value: "year" },
];

function buildStats(stats) {
  return [
    {
      label: "Total Users",
      value: Number(stats.totalUsers || 0).toLocaleString(),
      sub: "Registered accounts",
      subGreen: false,
    },
    {
      label: "Questions Classified",
      value: Number(stats.totalQuestions || 0).toLocaleString(),
      sub: "Real question records",
      subGreen: false,
    },
    {
      label: "Indexed Upload Sources",
      value: Number(stats.totalUploads || 0).toLocaleString(),
      sub: "Documents available in RAG",
      subGreen: false,
    },
    {
      label: "Active Users Today",
      value: Number(stats.activeToday || 0).toLocaleString(),
      sub: "Distinct active sessions today",
      subGreen: false,
    },
    {
      label: "Model Accuracy",
      value: `${Number(stats.modelAccuracy || 0)}%`,
      sub: "Average confidence score",
      subGreen: false,
    },
  ];
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white px-4 py-2.5 text-xs shadow-lg">
        <p className="mb-1 text-gray-400">{label}</p>
        <p className="text-base font-bold text-[#FF385C]">{payload[0].value.toLocaleString()}</p>
        <p className="text-gray-400">questions classified</p>
      </div>
    );
  }

  return null;
}

export default function AdminDashboard() {
  const [range, setRange] = useState("week");
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [difficulty, setDifficulty] = useState([]);
  const [recentSignups, setRecentSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (nextRange = range) => {
    setLoading(true);
    setError("");

    try {
      const [statsResponse, activityResponse, difficultyResponse, signupsResponse] = await Promise.all([
        fetchAdminStats(),
        fetchAdminActivity(nextRange),
        fetchAdminDifficulty(),
        fetchRecentSignups(),
      ]);

      setStats(statsResponse);
      setActivity(Array.isArray(activityResponse) ? activityResponse : []);
      setDifficulty(Array.isArray(difficultyResponse) ? difficultyResponse : []);
      setRecentSignups(Array.isArray(signupsResponse) ? signupsResponse : []);
    } catch (nextError) {
      setError(nextError.message || "Could not load the admin dashboard.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadDashboard(range);
  }, [loadDashboard, range]);

  const totalDifficulty = useMemo(
    () => difficulty.reduce((sum, entry) => sum + Number(entry.value || 0), 0),
    [difficulty],
  );

  if (loading && !stats) {
    return <AdminPageLoading label="Loading admin dashboard..." />;
  }

  if (error && !stats) {
    return (
      <AdminPageError
        title="We could not load the admin dashboard."
        message={error}
        onRetry={() => loadDashboard(range)}
      />
    );
  }

  const dashboardStats = buildStats(stats || {});

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Platform Overview</h2>
        <p className="mt-1 text-sm text-gray-400">Live platform metrics sourced directly from the admin backend.</p>
      </div>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {dashboardStats.map((card, index) => (
          <StatCard
            key={card.label}
            {...card}
            icon={STAT_ICONS[index]}
            iconBg={STAT_STYLES[index].iconBg}
            iconColor={STAT_STYLES[index].iconColor}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100">
                <Activity className="h-4 w-4 text-[#FF385C]" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">Platform Activity Over Time</h3>
            </div>
            <select
              value={range}
              onChange={(event) => setRange(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FFB6C3]"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {error ? <p className="mb-3 text-xs font-medium text-[#FF385C]">{error}</p> : null}
          {activity.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activity} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF385C" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#FF385C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#FF385C", strokeWidth: 1, strokeDasharray: "4 4" }} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#FF385C"
                  strokeWidth={2.5}
                  fill="url(#adminGrad)"
                  dot={{ fill: "#FF385C", r: 4, strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: "#FF385C", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <AdminEmptyState
              icon={Activity}
              title="No activity data yet"
              description="As questions are classified, activity trends will appear here."
            />
          )}
        </div>

        <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100">
              <FileText className="h-4 w-4 text-[#FF385C]" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Platform-wide Difficulty</h3>
          </div>
          {difficulty.length > 0 && totalDifficulty > 0 ? (
            <div className="flex flex-1 flex-col items-center gap-4">
              <div className="relative">
                <PieChart width={170} height={170}>
                  <Pie
                    data={difficulty}
                    cx={81}
                    cy={81}
                    innerRadius={50}
                    outerRadius={76}
                    dataKey="value"
                    strokeWidth={3}
                    stroke="#fff"
                    paddingAngle={2}
                  >
                    {difficulty.map((entry, index) => (
                      <Cell key={`${entry.name}-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-extrabold text-gray-900">{totalDifficulty.toLocaleString()}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">Total</p>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3">
                {difficulty.map(({ name, value, color }) => (
                  <div key={name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
                      <span className="text-sm font-medium text-gray-600">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">{Number(value || 0).toLocaleString()}</span>
                      <span className="w-10 text-right text-xs text-gray-400">
                        {((Number(value || 0) / totalDifficulty) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <AdminEmptyState
              icon={FileText}
              title="No difficulty distribution yet"
              description="Difficulty percentages will show up here once questions have been classified."
            />
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-50 px-5 py-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-100">
              <UserPlus className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">Recent User Signups</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentSignups.length > 0 ? (
              recentSignups.map((user) => (
                <div key={user.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50/50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-[#FF385C]">
                    {(user.avatarInitial || user.name?.charAt(0) || "?").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-800">{user.name}</p>
                    <p className="truncate text-xs text-gray-400">{user.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        user.role === "admin" ? "bg-rose-100 text-rose-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {user.role}
                    </span>
                    <p className="mt-0.5 text-[11px] text-gray-400">{user.joinedAt}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-5">
                <AdminEmptyState
                  icon={UserPlus}
                  title="No recent signups"
                  description="Newly created users will appear here once the platform receives real signups."
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
