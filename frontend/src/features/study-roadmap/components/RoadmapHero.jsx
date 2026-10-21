import { BrainCircuit, CalendarDays, RefreshCw, ShieldCheck, Sparkles, Target } from "lucide-react";

function HeroMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-purple-100">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-2 text-lg font-extrabold text-white">{value}</p>
    </div>
  );
}

export default function RoadmapHero({ data, userName, onRegenerate, regenerating }) {
  const firstName = String(userName || "Learner").trim().split(/\s+/)[0];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2d0b59] via-purple-700 to-violet-600 p-5 text-white shadow-xl shadow-purple-900/15 sm:p-7">
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10 bg-white/5" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-fuchsia-400/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-purple-100">
              <Sparkles className="h-3.5 w-3.5" /> AI personalized for {firstName}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">AI-Generated Study Roadmap</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-purple-100/85">{data.summary}</p>
          </div>
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white px-4 py-2.5 text-sm font-bold text-purple-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
            Regenerate Roadmap
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <HeroMetric icon={BrainCircuit} label="Current level" value={data.currentLevel} />
          <HeroMetric icon={Target} label="Target level" value={data.targetLevel} />
          <HeroMetric icon={CalendarDays} label="Estimated time" value={`${data.estimatedDays} days`} />
          <HeroMetric icon={ShieldCheck} label="AI confidence" value={`${data.aiConfidence}%`} />
        </div>

        <div className="mt-5 rounded-2xl border border-white/15 bg-black/10 p-4">
          <div className="mb-2.5 flex items-center justify-between text-xs font-bold">
            <span className="text-purple-100">Overall progress</span>
            <span>{data.overallProgress}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-300 via-white to-emerald-300 transition-[width] duration-700"
              style={{ width: `${data.overallProgress}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
