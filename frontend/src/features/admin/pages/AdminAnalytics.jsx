import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart2, TrendingUp } from "lucide-react";
import { fetchAdminAnalytics } from "../../../api/adminApi.js";
import AdminEmptyState from "../components/AdminEmptyState.jsx";
import { AdminPageError, AdminPageLoading } from "../components/AdminPageState.jsx";

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetchAdminAnalytics();
      setAnalytics(response);
    } catch (nextError) {
      setError(nextError.message || "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading && !analytics) {
    return <AdminPageLoading label="Loading admin analytics..." />;
  }

  if (error && !analytics) {
    return (
      <AdminPageError
        title="We could not load analytics."
        message={error}
        onRetry={loadAnalytics}
      />
    );
  }

  const difficultyBySubject = analytics?.difficultyBySubject || [];
  const userGrowth = analytics?.userGrowth || [];
  const confidenceTrend = analytics?.confidenceTrend || [];
  const peakHours = analytics?.peakHours || [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Platform Analytics</h2>
        <p className="mt-1 text-sm text-gray-400">Usage, subject mix, confidence trends, and peak activity hours.</p>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="User Growth">
          {userGrowth.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF385C" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#FF385C" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#FF385C" fill="url(#growthFill)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <AdminEmptyState icon={TrendingUp} title="No user growth data yet" description="User signups will chart here once accounts are created." />
          )}
        </Card>

        <Card title="Confidence Trend">
          {confidenceTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={confidenceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="avg" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <AdminEmptyState icon={BarChart2} title="No confidence trend yet" description="Confidence averages appear here after question classifications exist." />
          )}
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Difficulty by Subject">
          {difficultyBySubject.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={difficultyBySubject} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="easy" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="medium" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hard" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <AdminEmptyState icon={BarChart2} title="No subject distribution yet" description="Difficulty-by-subject bars will render once classified questions are available." />
          )}
        </Card>

        <Card title="Peak Activity Hours">
          {peakHours.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#FF385C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <AdminEmptyState icon={TrendingUp} title="No peak-hour data yet" description="Question timestamps will populate hourly usage here." />
          )}
        </Card>
      </section>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-gray-800">{title}</h3>
      {children}
    </div>
  );
}
