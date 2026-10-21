import { useState } from "react";
import { Check, ChevronDown, LockKeyhole, Play, Route } from "lucide-react";

const STATUS = {
  completed: { label: "Completed", icon: Check, dot: "bg-emerald-500", text: "text-emerald-600" },
  in_progress: { label: "In progress", icon: Play, dot: "bg-purple-600", text: "text-purple-600" },
  locked: { label: "Locked", icon: LockKeyhole, dot: "bg-gray-300", text: "text-gray-400" },
};

export default function RoadmapTimeline({ topics, onContinue }) {
  const [expandedId, setExpandedId] = useState(topics.find(topic => topic.status === "in_progress")?.id || null);

  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
          <Route className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-extrabold text-gray-900">Learning Timeline</h2>
          <p className="text-xs text-gray-400">Complete milestones in the recommended order.</p>
        </div>
      </div>

      <div className="space-y-0">
        {topics.map((topic, index) => {
          const status = STATUS[topic.status] || STATUS.locked;
          const Icon = status.icon;
          const expanded = expandedId === topic.id;
          return (
            <div key={topic.id} className="relative pl-10">
              {index < topics.length - 1 && <span className="absolute left-[15px] top-8 h-full w-px bg-gray-200" />}
              <span className={`absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full text-white ring-4 ring-white ${status.dot}`}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : topic.id)}
                className="mb-3 flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-gray-50"
                aria-expanded={expanded}
              >
                <div>
                  <p className="text-sm font-bold text-gray-800">{topic.name}</p>
                  <p className={`mt-0.5 text-[11px] font-semibold ${status.text}`}>{status.label} · {topic.progress}%</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded && (
                <div className="mb-4 rounded-xl border border-purple-100 bg-purple-50/60 p-3">
                  <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-purple-500" style={{ width: `${topic.progress}%` }} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
                    <span>{topic.questionsSolved}/{topic.totalQuestions} questions solved</span>
                    <span>Next: {topic.recommendedNext}</span>
                  </div>
                  {topic.status === "in_progress" && (
                    <button type="button" onClick={() => onContinue(topic)} className="mt-3 text-xs font-bold text-purple-600 hover:text-purple-700">
                      Continue this topic →
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
