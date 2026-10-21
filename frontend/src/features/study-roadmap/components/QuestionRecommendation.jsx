import { ArrowUpRight, Clock3 } from "lucide-react";
import { diffBadge } from "../../../utils/difficulty.js";

export default function QuestionRecommendation({ questions, onSolve }) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="font-extrabold text-gray-900">Recommended Questions</h2>
        <p className="mt-1 text-xs text-gray-400">AI-selected practice for your next roadmap milestones.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {questions.map(question => (
          <article key={question.id} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-purple-100 hover:shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${diffBadge[question.difficulty]}`}>{question.difficulty}</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400"><Clock3 className="h-3 w-3" />{question.estimatedTime}</span>
            </div>
            <h3 className="mt-3 text-sm font-extrabold leading-5 text-gray-800">{question.title}</h3>
            <p className="mt-2 flex-1 text-[11px] leading-5 text-gray-400">{question.reason}</p>
            <button type="button" onClick={() => onSolve(question)} className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800">
              Solve now <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
