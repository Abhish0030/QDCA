import { Loader2 } from "lucide-react";

/** Animated loading skeleton shown while detection is running */
export default function DetectionSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
          <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
        </div>
        <span className="text-sm font-semibold text-purple-600">Analyzing question…</span>
      </div>

      {/* Skeleton rows */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-24 h-3 bg-gray-100 rounded" />
          <div className="w-20 h-5 bg-purple-100 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-28 h-3 bg-gray-100 rounded" />
          <div className="w-16 h-5 bg-gray-100 rounded-full" />
          <div className="w-20 h-5 bg-gray-100 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 h-3 bg-gray-100 rounded" />
          <div className="w-24 h-5 bg-blue-50 rounded-lg" />
          <div className="w-20 h-5 bg-blue-50 rounded-lg" />
        </div>
        <div className="w-32 h-3 bg-gray-100 rounded" />
      </div>
    </div>
  );
}
