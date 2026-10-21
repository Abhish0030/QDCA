import { BarChart3 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function ChartCard({ title, children }) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-xs font-extrabold text-gray-700">{title}</h3>
      {children}
    </article>
  );
}

export default function AnalyticsSection({ charts }) {
  const difficultyTotal = charts.difficulty.reduce((sum, item) => sum + item.value, 0);

  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-extrabold text-gray-900">Learning Analytics</h2>
          <p className="text-xs text-gray-400">Patterns from your classified questions and roadmap progress.</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Difficulty distribution">
          {difficultyTotal === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-center text-xs text-gray-400">Classify questions to populate this chart.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={charts.difficulty} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={3}>
                  {charts.difficulty.map(item => <Cell key={item.name} fill={item.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Accuracy by topic">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts.topicPerformance} margin={{ left: -20, right: 4 }}>
              <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "#f5f3ff" }} />
              <Bar dataKey="accuracy" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="30-day progress trend">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={charts.progressTrend} margin={{ left: -20, right: 4 }}>
              <defs>
                <linearGradient id="roadmapProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 4" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="progress" stroke="#7c3aed" strokeWidth={2.5} fill="url(#roadmapProgress)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}
