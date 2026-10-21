import { Lightbulb, Sparkles } from "lucide-react";

export default function RecommendationPanel({ recommendations }) {
  return (
    <section className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-fuchsia-50 p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-200">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-extrabold text-gray-900">AI Recommendations</h2>
          <p className="text-xs text-gray-400">Next actions selected from your current progress.</p>
        </div>
      </div>
      <ul className="space-y-2.5">
        {recommendations.map((recommendation, index) => (
          <li key={recommendation} className="flex items-start gap-3 rounded-xl border border-purple-100/70 bg-white/80 p-3 text-xs leading-5 text-gray-600">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-[10px] font-extrabold text-purple-600">{index + 1}</span>
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span>{recommendation}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
