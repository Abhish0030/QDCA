import DashboardEnhancements from "../components/DashboardEnhancements";
import StatCard from "../components/StatCard";
import ActivityFeedCard from "../components/ActivityFeedCard";
import RecentClassifications from "../components/RecentClassifications";
import RecentUploads from "../components/RecentUploads";

export default function DashboardPage({
  stats,
  loading,
  error = "",
  overview,
  overviewLoading,
  overviewError = "",
  refreshKey,
  onNavigate,
  onOpenChatbot,
}) {
  const safeStats = Array.isArray(stats)
    ? stats.map((item, index) => ({
        ...item,
        label: typeof item?.label === "string" ? item.label : `Stat ${index + 1}`,
        sub: typeof item?.sub === "string" ? item.sub : item?.sub == null ? "" : String(item.sub),
      }))
    : [];

  return (
    <div className="space-y-4 sm:space-y-5 xl:space-y-6">
      <DashboardEnhancements
        overview={overview}
        loading={overviewLoading}
        error={overviewError}
        onNavigate={onNavigate}
        onOpenChatbot={onOpenChatbot}
      />

      {(error || overviewError) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {overviewError || error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {loading || !stats
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[118px] rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse" />
            ))
          : safeStats.length === 0
            ? (
                <div className="col-span-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-sm text-gray-400">
                  Dashboard data is unavailable.
                </div>
              )
            : safeStats.map(s => <StatCard key={s.label} {...s} />)
        }
      </section>
      <section className="grid grid-cols-1 gap-4 xl:gap-5 2xl:grid-cols-2">
        <RecentClassifications refreshKey={refreshKey} onPrimaryAction={() => onNavigate?.("Classify Question")} />
        <RecentUploads refreshKey={refreshKey} onPrimaryAction={() => onNavigate?.("Classify Question")} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:gap-5">
        <ActivityFeedCard limit={5} refreshKey={refreshKey} onPrimaryAction={() => onNavigate?.("Classify Question")} />
      </section>
    </div>
  );
}
