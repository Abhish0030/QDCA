/**
 * StatusBadge — pill badge for role / status / difficulty.
 * variant: 'role' | 'status' | 'difficulty'
 */
const CONFIG = {
  // role
  admin:      "bg-purple-100 text-purple-700",
  super_admin:"bg-purple-100 text-purple-700",
  user:       "bg-gray-100 text-gray-500",
  // status
  active:     "bg-green-100 text-green-700",
  suspended:  "bg-red-100 text-red-500",
  healthy:    "bg-green-100 text-green-700",
  warning:    "bg-yellow-100 text-yellow-700",
  unhealthy:  "bg-red-100 text-red-500",
  pending:    "bg-gray-100 text-gray-500",
  approved:   "bg-green-100 text-green-700",
  flagged:    "bg-orange-100 text-orange-700",
  reviewed:   "bg-blue-100 text-blue-700",
  needs_override: "bg-orange-100 text-orange-700",
  verified:   "bg-green-100 text-green-700",
  unverified: "bg-yellow-100 text-yellow-700",
  // difficulty
  "Very Easy": "bg-green-100 text-green-700",
  Easy:         "bg-lime-100 text-lime-700",
  Medium:       "bg-yellow-100 text-yellow-700",
  Hard:         "bg-orange-100 text-orange-700",
  Expert:       "bg-red-100 text-red-600",
  // upload status
  done:       "bg-green-100 text-green-700",
  completed:  "bg-green-100 text-green-700",
  processed:  "bg-green-100 text-green-700",
  queued:     "bg-gray-100 text-gray-500",
  processing: "bg-yellow-100 text-yellow-700",
  failed:     "bg-red-100 text-red-500",
  Security:   "bg-red-100 text-red-500",
  Moderation: "bg-blue-100 text-blue-700",
  Automation: "bg-yellow-100 text-yellow-700",
  Reporting:  "bg-purple-100 text-purple-700",
};

export default function StatusBadge({ value }) {
  const cls = CONFIG[value] ?? "bg-gray-100 text-gray-500";
  const label = String(value).replace(/_/g, " ");
  return (
    <span className={`inline-flex min-h-6 items-center justify-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold leading-none capitalize ${cls}`}>
      {(value === "processing" || value === "warning") && (
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-1.5 animate-pulse" />
      )}
      {label}
    </span>
  );
}
