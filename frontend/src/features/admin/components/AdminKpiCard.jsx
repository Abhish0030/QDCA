import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";

export default function AdminKpiCard({
  icon: Icon,
  iconClassName,
  iconWrapClassName,
  label,
  value,
  suffix = "",
  trend = 0,
  trendLabel,
  tooltip,
  loading = false,
}) {
  const positive = trend >= 0;

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="h-11 w-11 rounded-2xl bg-gray-100" />
          <div className="h-5 w-16 rounded-full bg-gray-100" />
        </div>
        <div className="mt-5 h-3 w-28 rounded bg-gray-100" />
        <div className="mt-3 h-8 w-24 rounded bg-gray-100" />
        <div className="mt-3 h-3 w-32 rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <motion.div whileHover={{ y: -2 }} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconWrapClassName || "bg-purple-100"}`}>
          {Icon ? <Icon className={`h-5 w-5 ${iconClassName || "text-purple-600"}`} /> : null}
        </div>
        <div className="relative flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
          </span>
          {tooltip ? (
            <div className="relative">
              <Info className="h-4 w-4 text-gray-300 transition-colors group-hover:text-gray-400" />
              <div className="pointer-events-none absolute right-0 top-6 z-10 hidden w-56 rounded-2xl border border-gray-100 bg-white p-3 text-xs leading-5 text-gray-500 shadow-lg group-hover:block">
                {tooltip}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-gray-900">
        {typeof value === "number" ? value.toLocaleString() : value}
        {suffix}
      </p>
      <p className="mt-2 text-sm text-gray-500">{trendLabel}</p>
    </motion.div>
  );
}
