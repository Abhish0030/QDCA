import { ArrowRight, BookOpen, Target } from "lucide-react";
import { diffBadge } from "../../../utils/difficulty.js";

export default function TopicCard({ topic, onContinue }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-purple-100 hover:shadow-xl hover:shadow-purple-900/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-500">{topic.subject}</p>
          <h3 className="mt-1 text-base font-extrabold text-gray-900">{topic.name}</h3>
        </div>
        <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${diffBadge[topic.difficulty]}`}>
          {topic.difficulty}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex justify-between text-[11px] font-bold text-gray-500">
          <span>Progress</span><span>{topic.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500" style={{ width: `${topic.progress}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-500">
        <BookOpen className="h-4 w-4 text-purple-500" /> {topic.questionsSolved} / {topic.totalQuestions} solved
      </div>

      {topic.weakConcepts.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Weak concepts</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topic.weakConcepts.map(concept => (
              <span key={concept} className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-600">{concept}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl bg-purple-50 p-3 text-[11px] leading-5 text-purple-700">
        <span className="font-bold"><Target className="mr-1 inline h-3.5 w-3.5" /> AI recommendation:</span> {topic.recommendation}
      </div>

      <button
        type="button"
        onClick={() => onContinue(topic)}
        disabled={topic.status === "locked"}
        className="mt-auto flex items-center justify-center gap-2 pt-4 text-xs font-bold text-purple-600 transition hover:text-purple-800 disabled:cursor-not-allowed disabled:text-gray-300"
      >
        {topic.status === "locked" ? "Complete the previous topic first" : "Continue topic"}
        {topic.status !== "locked" && <ArrowRight className="h-3.5 w-3.5" />}
      </button>
    </article>
  );
}
