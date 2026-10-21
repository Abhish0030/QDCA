/** Coloured confidence score badge */
export default function ConfidenceBadge({ value }) {
  const color = value >= 90
    ? "bg-green-100 text-green-700"
    : value >= 75
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-500";

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
      🎯 {value}%
    </span>
  );
}
