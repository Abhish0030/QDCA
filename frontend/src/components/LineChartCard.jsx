import { useEffect, useId, useMemo, useState } from "react";
import { Activity, CalendarDays, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchLineChart } from "../api";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-purple-100 bg-white/95 px-3.5 py-2.5 shadow-xl shadow-purple-900/10 backdrop-blur-sm">
      <p className="text-[11px] font-semibold text-slate-400">{label}</p>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span className="text-lg font-extrabold text-slate-900">{Number(payload[0].value).toLocaleString()}</span>
        <span className="text-[11px] font-semibold text-purple-600">questions</span>
      </div>
    </div>
  );
}

function formatAxisValue(value) {
  return value >= 1000 ? `${Number((value / 1000).toFixed(1))}K` : value.toLocaleString();
}

function formatDelta(change) {
  if (change == null) {
    return { label: "Building baseline", tone: "text-slate-500", icon: Activity };
  }

  if (change > 0) {
    return { label: `Up ${Math.abs(change).toFixed(0)}%`, tone: "text-emerald-600", icon: TrendingUp };
  }

  if (change < 0) {
    return { label: `Down ${Math.abs(change).toFixed(0)}%`, tone: "text-rose-600", icon: TrendingDown };
  }

  return { label: "Flat vs prior", tone: "text-amber-600", icon: Activity };
}

export default function LineChartCard({ refreshKey = 0 }) {
  const [range, setRange] = useState("This Week");
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const gradientId = `trend-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    setLoading(true);
    setError("");
    fetchLineChart(range)
      .then(setChartData)
      .catch(() => {
        setChartData([]);
        setError("Chart data is unavailable");
      })
      .finally(() => setLoading(false));
  }, [range, refreshKey]);

  const summary = useMemo(() => {
    const values = chartData.map(item => Number(item.value) || 0);
    const total = values.reduce((sum, value) => sum + value, 0);
    const peak = values.length ? Math.max(...values) : 0;
    const latest = values.at(-1) ?? 0;
    const previous = values.at(-2) ?? 0;
    const average = values.length ? total / values.length : 0;
    const change = previous === 0 ? (latest > 0 ? 100 : null) : ((latest - previous) / previous) * 100;
    return { total, peak, latest, average, change };
  }, [chartData]);
  const latestTrend = formatDelta(summary.change);
  const TrendIcon = latestTrend.icon;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_18px_45px_-32px_rgba(76,29,149,0.35)]">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 text-white shadow-lg shadow-purple-200">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Questions Analyzed</h3>
            <p className="mt-0.5 text-[11px] font-medium text-slate-400">Classification activity over time</p>
          </div>
        </div>

        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-purple-500" />
          <select
            value={range}
            onChange={event => setRange(event.target.value)}
            aria-label="Chart date range"
            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs font-semibold text-slate-600 outline-none transition hover:border-purple-200 hover:bg-purple-50 focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          >
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</span>
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-slate-100 border-b border-slate-100 bg-slate-50/60 px-2 py-3 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="px-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total</p>
          <p className="mt-0.5 text-lg font-extrabold text-slate-900">{summary.total.toLocaleString()}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-500">{summary.average.toFixed(summary.average >= 10 ? 0 : 1)} avg per period</p>
        </div>
        <div className="px-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Peak</p>
          <p className="mt-0.5 text-lg font-extrabold text-slate-900">{summary.peak.toLocaleString()}</p>
          <p className="mt-1 text-[11px] font-medium text-slate-500">{summary.latest.toLocaleString()} in latest period</p>
        </div>
        <div className="px-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Latest trend</p>
          <div className={`mt-0.5 inline-flex items-center gap-2 text-lg font-extrabold ${latestTrend.tone}`}>
            <TrendIcon className="h-4 w-4" />
            <span>{latestTrend.label}</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-slate-500">Compared with the previous period</p>
        </div>
      </div>

      <div className="px-3 pb-4 pt-5 sm:px-5">
        {loading ? (
          <div className="h-[240px] animate-pulse rounded-xl bg-gradient-to-r from-slate-50 via-purple-50/60 to-slate-50" />
        ) : chartData.length === 0 ? (
          <div className="flex h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center">
            <Activity className="mb-2 h-6 w-6 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">{error || "No analyzed questions yet"}</p>
            <p className="mt-1 text-xs text-slate-400">New classifications will appear here.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 12, right: 10, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.28} />
                  <stop offset="70%" stopColor="#a78bfa" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 5" stroke="#e9edf5" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                dy={9}
                interval="preserveStartEnd"
                minTickGap={28}
              />
              <YAxis
                allowDecimals={false}
                domain={[0, dataMax => Math.max(4, Math.ceil(dataMax * 1.15))]}
                tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={formatAxisValue}
              />
              <ReferenceLine
                y={summary.average}
                ifOverflow="extendDomain"
                stroke="#cbd5e1"
                strokeDasharray="4 4"
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "#a78bfa", strokeWidth: 1, strokeDasharray: "4 4" }}
              />
              <Area
                type="linear"
                dataKey="value"
                stroke="#7c3aed"
                strokeWidth={3}
                fill={`url(#${gradientId})`}
                animationDuration={900}
                isAnimationActive
                dot={{ fill: "#8b5cf6", r: 4, strokeWidth: 2.5, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#7c3aed", strokeWidth: 3, stroke: "#ede9fe" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
