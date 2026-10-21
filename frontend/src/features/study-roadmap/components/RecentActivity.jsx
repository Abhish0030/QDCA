import { Activity, CheckCircle2 } from "lucide-react";

export default function RecentActivity({ items }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-extrabold text-gray-900">Recent Activity</h2>
          <p className="text-xs text-gray-400">Your latest learning events.</p>
        </div>
      </div>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="relative flex gap-3 pl-1">
            {index < items.length - 1 && <span className="absolute left-[9px] top-6 h-full w-px bg-gray-100" />}
            <CheckCircle2 className="relative z-10 mt-0.5 h-4 w-4 shrink-0 bg-white text-emerald-500" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-bold text-gray-700">{item.type}</p>
                <span className="shrink-0 text-[10px] text-gray-400">{item.time}</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-gray-400" title={item.detail}>{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
