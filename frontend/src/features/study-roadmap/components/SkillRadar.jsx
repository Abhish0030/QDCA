import { Crosshair } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

export default function SkillRadar({ skills }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-2 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
          <Crosshair className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-extrabold text-gray-900">Skill Radar</h2>
          <p className="text-xs text-gray-400">Proficiency across core problem-solving skills.</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={skills} outerRadius="68%">
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#64748b" }} />
          <Radar dataKey="score" stroke="#7c3aed" strokeWidth={2.5} fill="#8b5cf6" fillOpacity={0.28} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </section>
  );
}
