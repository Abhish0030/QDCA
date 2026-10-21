/** Pill chip for a subject label */
export default function SubjectChip({ label, variant = "subject" }) {
  const cls = variant === "primary"
    ? "bg-purple-100 text-purple-700 font-semibold"
    : "bg-gray-100 text-gray-600 font-medium";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs ${cls}`}>
      {label}
    </span>
  );
}
