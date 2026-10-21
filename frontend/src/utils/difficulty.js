export const DIFFICULTY_LEVELS = [
  {
    key: "very_easy",
    label: "Very Easy",
    marker: "●",
    description: "Basic recall and factual questions.",
    color: "#16a34a",
    badge: "bg-green-50 text-green-700 ring-green-200",
    panel: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700" },
  },
  {
    key: "easy",
    label: "Easy",
    marker: "■",
    description: "Simple understanding and direct application.",
    color: "#84cc16",
    badge: "bg-lime-50 text-lime-700 ring-lime-200",
    panel: { bg: "bg-lime-50", border: "border-lime-200", text: "text-lime-700" },
  },
  {
    key: "medium",
    label: "Medium",
    marker: "●",
    description: "Moderate conceptual thinking.",
    color: "#eab308",
    badge: "bg-yellow-50 text-yellow-700 ring-yellow-200",
    panel: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700" },
  },
  {
    key: "hard",
    label: "Hard",
    marker: "●",
    description: "Multi-step reasoning and analysis.",
    color: "#f97316",
    badge: "bg-orange-50 text-orange-700 ring-orange-200",
    panel: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700" },
  },
  {
    key: "expert",
    label: "Expert",
    marker: "●",
    description: "Advanced analytical or research-level questions.",
    color: "#dc2626",
    badge: "bg-red-50 text-red-700 ring-red-200",
    panel: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
  },
];

export const DIFFICULTY_LABELS = DIFFICULTY_LEVELS.map(({ label }) => label);

export const DIFFICULTY_BY_LABEL = Object.fromEntries(
  DIFFICULTY_LEVELS.map(level => [level.label, level]),
);

export function normalizeDifficulty(value) {
  const key = String(value || "medium").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return DIFFICULTY_LEVELS.find(level => level.key === key)?.label || "Medium";
}

export function getDifficulty(value) {
  return DIFFICULTY_BY_LABEL[normalizeDifficulty(value)] || DIFFICULTY_BY_LABEL.Medium;
}

export const diffBadge = Object.fromEntries(
  DIFFICULTY_LEVELS.map(level => [level.label, `${level.badge} ring-1 ring-inset`]),
);
