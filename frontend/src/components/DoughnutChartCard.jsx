import { useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { fetchPieChart } from "../api";

function CustomTooltip({ active, payload, total }) {
  if (active && payload?.length) {
    const { name, value, color } = payload[0].payload;
    return (
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-lg text-xs">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="font-semibold text-gray-700">{name}</span>
        </div>
        <p className="text-gray-400">{value.toLocaleString()} questions</p>
        <p className="text-gray-400">{((value / (total || 1)) * 100).toFixed(1)}% of total</p>
      </div>
    );
  }
  return null;
}

export default function DoughnutChartCard({ refreshKey = 0 }) {
  const [pieData, setPieData] = useState([]);
  const [error, setError] = useState("");
  const total = pieData.reduce((a, b) => a + b.value, 0);

  useEffect(() => {
    fetchPieChart()
      .then(data => {
        setError("");
        setPieData(data);
      })
      .catch(() => {
        setPieData([]);
        setError("Couldn't load difficulty distribution right now. Try refreshing in a moment.");
      });
  }, [refreshKey]);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
          <BarChart2 className="w-4 h-4 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-800 text-sm">Difficulty Distribution</h3>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : null}

      {total === 0 ? (
        <div className="flex-1 min-h-[220px] flex items-center justify-center text-sm text-gray-400">
          No difficulty data yet
        </div>
      ) : (
      <div className="flex flex-col items-center gap-4 flex-1">
        <div className="relative h-[170px] w-full max-w-[170px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius="58%" outerRadius="88%"
                dataKey="value" strokeWidth={3} stroke="#fff" paddingAngle={2}>
              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip total={total} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xl font-extrabold text-gray-900">{(total / 1000).toFixed(1)}K</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Total</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          {pieData.map(({ name, value, color }) => (
            <div key={name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-sm text-gray-600 font-medium">{name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-800">{value.toLocaleString()}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{((value / total) * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
          <div className="mt-1 h-2 rounded-full overflow-hidden flex gap-0.5">
            {pieData.map(({ name, value, color }) => (
              <div key={name} className="h-full rounded-full" style={{ width: `${(value / total) * 100}%`, background: color }} />
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
