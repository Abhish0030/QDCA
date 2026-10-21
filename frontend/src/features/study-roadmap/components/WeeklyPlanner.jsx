import { CheckCircle2, Clock3, CalendarRange } from "lucide-react";

export default function WeeklyPlanner({ days }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <CalendarRange className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-extrabold text-gray-900">Weekly Study Planner</h2>
          <p className="text-xs text-gray-400">A balanced plan you can finish consistently.</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
        {days.map(day => (
          <article
            key={day.day}
            className={`rounded-2xl border p-3 transition ${day.status === "today" ? "border-purple-300 bg-purple-50 shadow-md shadow-purple-100" : day.status === "completed" ? "border-emerald-100 bg-emerald-50/60" : "border-gray-100 bg-gray-50/70 hover:border-purple-100 hover:bg-white"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">{day.day.slice(0, 3)}</p>
              {day.status === "completed" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              {day.status === "today" && <span className="h-2 w-2 rounded-full bg-purple-500 ring-4 ring-purple-100" />}
            </div>
            <p className="mt-3 min-h-9 text-xs font-bold leading-4 text-gray-700">{day.topic}</p>
            <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-gray-400">
              <Clock3 className="h-3 w-3" /> {day.estimatedTime}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
