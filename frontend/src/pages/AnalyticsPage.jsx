import { useEffect, useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import {
  fetchLineChart,
  fetchPieChart,
  fetchClassifications,
  fetchPipelineContribution,
  fetchProcessingPerformance,
  fetchStats,
} from "../api";
import DoughnutChartCard from "../components/DoughnutChartCard";
import LineChartCard from "../components/LineChartCard";
import { lineData, pieData as fallbackPie, classifications as fallbackClass } from "../data";
import { DIFFICULTY_LEVELS } from "../utils/difficulty";

function InsightCard({ title, value, detail, accent = "text-purple-600" }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">{title}</p>
      <p className={`mt-2 text-lg font-extrabold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-gray-500">{detail}</p>
    </div>
  );
}

function PerformanceMetricCard({ title, summary, accent = "text-purple-600" }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">{title}</p>
      <p className={`mt-2 text-2xl font-extrabold ${accent}`}>{formatDuration(summary?.averageMs)}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>P95 {formatDuration(summary?.p95Ms)}</span>
        <span>{summary?.sampleCount ?? 0} samples</span>
      </div>
    </div>
  );
}

function parseAnalyticsDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDuration(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0 ms";
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(1)}s`;
  return `${Math.round(numeric)} ms`;
}

function buildPerformanceStageData(performanceData) {
  if (!performanceData) return [];

  return [
    ...(performanceData.classification?.stages || []).map(stage => ({
      name: `Classify · ${stage.label}`,
      averageMs: stage.averageMs,
      p95Ms: stage.p95Ms,
    })),
    ...(performanceData.answer?.stages || []).map(stage => ({
      name: `Answer · ${stage.label}`,
      averageMs: stage.averageMs,
      p95Ms: stage.p95Ms,
    })),
  ];
}

function buildPerformanceRoutes(performanceData) {
  if (!performanceData) return [];

  return [
    ...(performanceData.classification?.llmCalls || []).map(route => ({
      ...route,
      flow: "Classification",
    })),
    ...(performanceData.answer?.llmCalls || []).map(route => ({
      ...route,
      flow: "Answer",
    })),
  ].sort((left, right) => right.sampleCount - left.sampleCount || left.averageMs - right.averageMs);
}

export default function AnalyticsPage({ refreshKey = 0 }) {
  const [line,  setLine]  = useState(lineData);
  const [pie,   setPie]   = useState(fallbackPie);
  const [clazz, setClazz] = useState(fallbackClass);
  const [stats, setStats] = useState(null);
  const [pipelineContribution, setPipelineContribution] = useState(null);
  const [processingPerformance, setProcessingPerformance] = useState(null);
  const [loadWarnings, setLoadWarnings] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadAnalytics() {
      const warnings = [];

      const results = await Promise.allSettled([
        fetchLineChart(),
        fetchPieChart(),
        fetchClassifications(),
        fetchStats(),
        fetchPipelineContribution(),
        fetchProcessingPerformance(),
      ]);

      if (!active) return;

      const [
        lineResult,
        pieResult,
        classificationsResult,
        statsResult,
        pipelineResult,
        performanceResult,
      ] = results;

      if (lineResult.status === "fulfilled") {
        setLine(lineResult.value);
      } else {
        warnings.push("Question trend is showing fallback data.");
      }

      if (pieResult.status === "fulfilled") {
        setPie(pieResult.value);
      } else {
        warnings.push("Difficulty distribution is showing fallback data.");
      }

      if (classificationsResult.status === "fulfilled") {
        setClazz(classificationsResult.value);
      } else {
        warnings.push("Classification analytics are showing fallback data.");
      }

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value);
      } else {
        warnings.push("Dashboard totals could not be refreshed.");
      }

      if (pipelineResult.status === "fulfilled") {
        setPipelineContribution(pipelineResult.value);
      } else {
        warnings.push("Pipeline contribution data is unavailable.");
      }

      if (performanceResult.status === "fulfilled") {
        setProcessingPerformance(performanceResult.value);
      } else {
        warnings.push("Processing performance data is unavailable.");
      }

      setLoadWarnings(warnings);
    }

    loadAnalytics();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const srcData = useMemo(() => {
    const srcMap = {};
    clazz.forEach(r => {
      srcMap[r.source] = (srcMap[r.source] || 0) + 1;
    });
    return Object.entries(srcMap).map(([name, value]) => ({ name, value }));
  }, [clazz]);

  const confData = useMemo(() => {
    const confBuckets = { "70–79": 0, "80–89": 0, "90–94": 0, "95–100": 0 };
    clazz.forEach(r => {
      if (r.conf >= 95) confBuckets["95–100"]++;
      else if (r.conf >= 90) confBuckets["90–94"]++;
      else if (r.conf >= 80) confBuckets["80–89"]++;
      else confBuckets["70–79"]++;
    });
    return Object.entries(confBuckets).map(([range, count]) => ({ range, count }));
  }, [clazz]);

  const validConfidenceItems = useMemo(() => (
    clazz
      .map(item => ({
        ...item,
        confidence: Number(item.conf ?? 0),
        parsedDate: parseAnalyticsDate(item.date),
      }))
      .filter(item => Number.isFinite(item.confidence) && item.confidence > 0)
  ), [clazz]);

  const averageConfidence = useMemo(() => (
    validConfidenceItems.length > 0
      ? Math.round(validConfidenceItems.reduce((sum, item) => sum + item.confidence, 0) / validConfidenceItems.length)
      : 0
  ), [validConfidenceItems]);

  const confidenceTrend = useMemo(() => {
    const confidenceTrendMap = {};
    validConfidenceItems.forEach(item => {
      const key = item.parsedDate
        ? item.parsedDate.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          })
        : (item.date || "Unknown");
      if (!confidenceTrendMap[key]) confidenceTrendMap[key] = { total: 0, count: 0 };
      confidenceTrendMap[key].total += item.confidence;
      confidenceTrendMap[key].count += 1;
    });
    return Object.entries(confidenceTrendMap)
      .map(([date, values]) => ({
        date,
        confidence: Math.round(values.total / values.count),
      }))
      .slice(-8);
  }, [validConfidenceItems]);

  const livePie = useMemo(() => (
    DIFFICULTY_LEVELS.map(level => ({
      name: level.label,
      value: stats?.[level.key === "very_easy" ? "veryEasy" : level.key]
        ?? pie.find(item => item.name === level.label)?.value
        ?? 0,
      color: level.color,
    }))
  ), [pie, stats]);

  const liveTotal = useMemo(() => (
    stats?.total ?? pie.reduce((a, b) => a + b.value, 0)
  ), [pie, stats]);

  const dominantDifficulty = useMemo(() => (
    livePie.reduce(
      (best, current) => (current.value > best.value ? current : best),
      livePie[0] || { name: "N/A", value: 0 },
    )
  ), [livePie]);

  const difficultyTrend = useMemo(() => (
    line.length >= 2
      ? Number(line[line.length - 1]?.value || 0) - Number(line[0]?.value || 0)
      : 0
  ), [line]);

  const weeklyGrowth = useMemo(() => (
    line.length >= 2
      ? Math.round(((Number(line[line.length - 1]?.value || 0) - Number(line[0]?.value || 0)) / Math.max(Number(line[0]?.value || 1), 1)) * 100)
      : 0
  ), [line]);

  const hardestTopic = useMemo(() => (
    srcData.reduce(
      (best, current) => (current.value > best.value ? current : best),
      srcData[0] || { name: "General", value: 0 },
    )
  ), [srcData]);
  const performanceStageData = useMemo(
    () => buildPerformanceStageData(processingPerformance),
    [processingPerformance],
  );
  const performanceRoutes = useMemo(
    () => buildPerformanceRoutes(processingPerformance),
    [processingPerformance],
  );
  const contributionItems = pipelineContribution?.items || [];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Analytics</h2>
        <p className="text-sm text-gray-400 mt-1">Detailed performance insights and trends.</p>
      </div>

      {loadWarnings.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadWarnings[0]}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {livePie.map(({ name, value, color }) => (
          <div key={name} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <p className="text-xs font-medium text-gray-400 mb-1">{name} Questions</p>
            <p className="text-2xl font-extrabold text-gray-900">{value.toLocaleString()}</p>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(value / (liveTotal || 1)) * 100}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2"><LineChartCard refreshKey={refreshKey} /></div>
        <DoughnutChartCard refreshKey={refreshKey} />
      </section>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
        {/* Source bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Questions by Subject</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={srcData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#7C3AED" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence bar */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Confidence Score Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={confData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Extended AI analytics */}
      <section className="space-y-5 pt-2">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">AI Confidence Trend</h4>
                <p className="mt-1 text-xs text-gray-400">Average confidence of the QDCA engine across recent classifications.</p>
              </div>
              <div className="rounded-2xl bg-purple-50 px-3 py-2 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-purple-400">Average</p>
                <p className="text-lg font-extrabold text-purple-600">{averageConfidence}%</p>
              </div>
            </div>
            {confidenceTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={confidenceTrend}>
                  <defs>
                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#A855F7" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#A855F7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={value => `${value}%`} />
                  <Tooltip formatter={(value) => [`${value}%`, "Avg confidence"]} />
                  <Area type="monotone" dataKey="confidence" stroke="#A855F7" strokeWidth={2.5} fill="url(#confidenceGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-gray-100 bg-gray-50/40 text-sm text-gray-400">
                No confidence trend data yet
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 text-sm">Processing Performance</h4>
              <p className="mt-1 text-xs text-gray-400">
                Live timing from recent classification and answer requests over the last {processingPerformance?.windowMinutes || 30} minutes.
              </p>
            </div>
            {processingPerformance?.hasTelemetry ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <PerformanceMetricCard
                    title="Classification Total"
                    summary={processingPerformance.classification?.total}
                  />
                  <PerformanceMetricCard
                    title="Answer Total"
                    summary={processingPerformance.answer?.total}
                    accent="text-emerald-600"
                  />
                </div>

                {performanceStageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={performanceStageData} layout="vertical" margin={{ left: 32 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={value => `${value} ms`}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 11, fill: "#9ca3af" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip formatter={(value) => [formatDuration(value), ""]} />
                      <Bar dataKey="averageMs" fill="#8B5CF6" radius={[0, 6, 6, 0]} name="Average" />
                      <Bar dataKey="p95Ms" fill="#22C55E" radius={[0, 6, 6, 0]} name="P95" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center rounded-2xl border border-dashed border-gray-100 bg-gray-50/40 text-sm text-gray-400">
                    Stage-level timing will appear after a few live requests.
                  </div>
                )}

                {performanceRoutes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {performanceRoutes.slice(0, 4).map(route => (
                      <div key={`${route.flow}-${route.key}`} className="rounded-2xl border border-gray-100 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">{route.flow}</p>
                            <h5 className="mt-1 text-sm font-semibold text-gray-800">{route.provider} · {route.model}</h5>
                          </div>
                          <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-bold text-white">
                            {route.sampleCount} calls
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <span>Average {formatDuration(route.averageMs)}</span>
                          <span>P95 {formatDuration(route.p95Ms)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-gray-100 bg-gray-50/40 px-6 text-center text-sm text-gray-400">
                Run a few live classifications or answer generations and this panel will populate with real backend timing data.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 text-sm">Hybrid AI Pipeline Contribution</h4>
              <p className="mt-1 text-xs text-gray-400">
                {pipelineContribution?.basis || "Live contribution estimates appear here once analytics data loads."}
              </p>
            </div>
            {contributionItems.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {contributionItems.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">{item.metricLabel}</p>
                      <p className="mt-2 text-xl font-extrabold text-gray-900">{item.metricValue}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  {contributionItems.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-gray-100 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h5 className="text-sm font-semibold text-gray-800">{item.label}</h5>
                          <p className="mt-1 text-xs leading-5 text-gray-500">{item.description}</p>
                        </div>
                        <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-bold text-white">
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${item.accent}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-dashed border-gray-100 bg-gray-50/40 px-4 py-3 text-xs text-gray-500">
                  Active model: <span className="font-semibold text-gray-700">{pipelineContribution?.activeModel?.label || "Unknown"}</span>
                  {" · "}
                  Questions analyzed: <span className="font-semibold text-gray-700">{pipelineContribution?.totalQuestions ?? 0}</span>
                </div>
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-gray-100 bg-gray-50/40 px-6 text-center text-sm text-gray-400">
                Generate a few classifications and add some RAG documents to unlock live pipeline contribution estimates.
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all duration-200 hover:shadow-md">
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 text-sm">AI Insights</h4>
              <p className="mt-1 text-xs text-gray-400">Automatically generated signals from live analytics and fallback estimations.</p>
            </div>
            <div className="space-y-3">
              <InsightCard
                title="Most Common Difficulty"
                value={dominantDifficulty?.name || "N/A"}
                detail={`${dominantDifficulty?.value?.toLocaleString?.() || 0} questions dominate the current difficulty mix.`}
              />
              <InsightCard
                title="Average AI Confidence"
                value={`${averageConfidence}%`}
                detail="Confidence remains stable when classifications cluster near consistent cognitive patterns."
                accent="text-emerald-600"
              />
              <InsightCard
                title="Difficulty Trend"
                value={difficultyTrend >= 0 ? "Trending Up" : "Trending Down"}
                detail={`${Math.abs(difficultyTrend).toLocaleString()} change across the current visible time window.`}
                accent={difficultyTrend >= 0 ? "text-purple-600" : "text-amber-600"}
              />
              <InsightCard
                title="Hardest Topic / Category"
                value={hardestTopic?.name || "General"}
                detail={`${hardestTopic?.value?.toLocaleString?.() || 0} classified questions currently cluster in this category.`}
                accent="text-indigo-600"
              />
              <InsightCard
                title="Weekly Classification Growth"
                value={`${weeklyGrowth >= 0 ? "+" : ""}${weeklyGrowth}%`}
                detail="Calculated from the current question trend series shown on the analytics page."
                accent={weeklyGrowth >= 0 ? "text-green-600" : "text-rose-600"}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
