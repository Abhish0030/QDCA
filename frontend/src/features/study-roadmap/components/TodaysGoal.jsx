import { ArrowRight, Clock3, Flame, ListChecks } from "lucide-react";

export default function TodaysGoal({ goal, onContinue }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-5 shadow-sm sm:p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-orange-200/30 blur-2xl" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.15em] text-orange-600">
            <Flame className="h-4 w-4" /> Today&apos;s goal
          </div>
          <h2 className="mt-2 text-2xl font-extrabold text-gray-900">{goal.topic}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm ring-1 ring-gray-100">
              <ListChecks className="h-3.5 w-3.5 text-purple-500" /> Solve {goal.questions} {goal.difficulty} questions
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm ring-1 ring-gray-100">
              <Clock3 className="h-3.5 w-3.5 text-orange-500" /> {goal.estimatedTime}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          Continue Learning <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
