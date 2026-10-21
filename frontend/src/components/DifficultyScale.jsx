import { DIFFICULTY_LEVELS, getDifficulty } from "../utils/difficulty";

export default function DifficultyScale({ activeDifficulty }) {
  const active = activeDifficulty ? getDifficulty(activeDifficulty).label : null;

  return (
    <div aria-label="Five difficulty levels" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {DIFFICULTY_LEVELS.map(level => {
        const selected = active === level.label;
        return (
          <div
            key={level.key}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 transition-all ${selected ? `${level.panel.bg} ${level.panel.border} shadow-sm` : "border-gray-100 bg-gray-50/70"}`}
          >
            <span aria-hidden="true" style={{ color: level.color }}>{level.marker}</span>
            <span className={`text-xs font-bold ${selected ? level.panel.text : "text-gray-700"}`}>{level.label}</span>
          </div>
        );
      })}
    </div>
  );
}
