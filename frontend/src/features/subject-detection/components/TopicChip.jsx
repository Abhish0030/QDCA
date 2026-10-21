/** Pill chip for a topic/subtopic label */
export default function TopicChip({ label }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100">
      {label}
    </span>
  );
}
