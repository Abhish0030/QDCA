import { ArrowUpRight } from "lucide-react";

export default function ProgressCard({ icon: Icon, label, value, subtitle, trend, color }) {
  return (
    <article className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-purple-100 hover:shadow-lg hover:shadow-purple-900/5">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
          {trend} <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900">{value}</p>
      <p className="mt-1 text-xs font-bold text-gray-600">{label}</p>
      <p className="mt-1 text-[11px] leading-4 text-gray-400">{subtitle}</p>
    </article>
  );
}
