import { Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

export default function DashboardEmptyState({
  title = "No recent activity yet.",
  description = "Your latest dashboard activity will appear here as soon as you start using QDCA.",
  actionLabel = "Analyze Your First Question",
  onAction,
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="px-5 py-10 text-center">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="mx-auto flex max-w-sm flex-col items-center"
      >
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-purple-50">
          <span className="absolute inset-0 rounded-[1.5rem] bg-gradient-to-br from-purple-100 to-purple-50" />
          <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-purple-200" />
          <span className="absolute -left-1 bottom-1 h-3 w-3 rounded-full bg-pink-100" />
          <Sparkles className="relative h-7 w-7 text-purple-600" />
        </div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-gray-400">{description}</p>
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-4 rounded-xl border border-purple-200 bg-white px-4 py-2 text-sm font-semibold text-purple-600 transition-all duration-200 hover:-translate-y-0.5 hover:bg-purple-50 hover:shadow-sm"
          >
            {actionLabel}
          </button>
        )}
      </motion.div>
    </div>
  );
}
