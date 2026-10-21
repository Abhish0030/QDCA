import ActivityFeedCard from "../components/ActivityFeedCard";
import LeaderboardCard from "../components/LeaderboardCard";

export default function ActivityPage({ refreshKey = 0 }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Activity</h2>
        <p className="text-sm text-gray-400 mt-1">Recent actions across every user in the system.</p>
      </div>

      <LeaderboardCard limit={20} refreshKey={refreshKey} />
      <ActivityFeedCard limit={20} showViewAll={false} fullHeight refreshKey={refreshKey} />
    </div>
  );
}
