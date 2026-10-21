import { Bolt, Flame, Sparkles, Target, Trophy } from "lucide-react";

const ICONS = { spark: Sparkles, target: Target, flame: Flame, trophy: Trophy, bolt: Bolt };

export default function Achievements({ achievements }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-extrabold text-gray-900">Achievements</h2>
      <p className="mt-1 text-xs text-gray-400">Milestones that reward consistent learning.</p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {achievements.map(achievement => {
          const Icon = ICONS[achievement.icon] || Trophy;
          return (
            <article key={achievement.name} className={`rounded-2xl border p-3 text-center transition ${achievement.unlocked ? "border-amber-200 bg-gradient-to-b from-amber-50 to-white shadow-sm" : "border-gray-100 bg-gray-50 opacity-55 grayscale"}`}>
              <div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${achievement.unlocked ? "bg-amber-100 text-amber-600" : "bg-gray-200 text-gray-400"}`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-2 text-xs font-extrabold text-gray-700">{achievement.name}</p>
              <p className="mt-1 text-[10px] leading-4 text-gray-400">{achievement.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
