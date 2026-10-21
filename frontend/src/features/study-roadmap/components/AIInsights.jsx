import { ArrowUpRight, Clock3, Gauge, Lightbulb, Medal, TrendingUp } from "lucide-react";

const ITEMS = [
  { key: "strongestTopic", label: "Strongest Topic", icon: Medal, color: "bg-emerald-100 text-emerald-600" },
  { key: "weakestTopic", label: "Weakest Topic", icon: Gauge, color: "bg-rose-100 text-rose-600" },
  { key: "averageSolveTime", label: "Average Solve Time", icon: Clock3, color: "bg-blue-100 text-blue-600" },
  { key: "mostImprovedTopic", label: "Most Improved", icon: TrendingUp, color: "bg-amber-100 text-amber-600" },
  { key: "suggestedNextTopic", label: "Suggested Next", icon: Lightbulb, color: "bg-purple-100 text-purple-600" },
  { key: "studyConsistency", label: "Study Consistency", icon: ArrowUpRight, color: "bg-cyan-100 text-cyan-600" },
];

export default function AIInsights({ insights }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-extrabold text-gray-900">AI Insights</h2>
      <p className="mt-1 text-xs text-gray-400">A concise read of your current learning behavior.</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {ITEMS.map(item => (
          <article key={item.key} className="rounded-2xl border border-gray-100 p-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color}`}>
              <item.icon className="h-4 w-4" />
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">{item.label}</p>
            <p className="mt-1 text-xs font-extrabold text-gray-700">{insights[item.key]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
