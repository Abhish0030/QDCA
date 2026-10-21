import { useState } from "react";
import { Search, User, TrendingUp, CheckCircle2 } from "lucide-react";

const STUDENTS = [
  { id: 1,  name: "Arjun Sharma",    class: "12-A", easy: 42, medium: 31, hard: 18, accuracy: 96, lastActive: "Today"     },
  { id: 2,  name: "Priya Patel",     class: "12-A", easy: 38, medium: 29, hard: 22, accuracy: 94, lastActive: "Today"     },
  { id: 3,  name: "Rohit Mehta",     class: "12-B", easy: 55, medium: 20, hard: 10, accuracy: 91, lastActive: "Yesterday" },
  { id: 4,  name: "Sneha Gupta",     class: "11-A", easy: 30, medium: 40, hard: 25, accuracy: 93, lastActive: "Today"     },
  { id: 5,  name: "Karan Singh",     class: "11-B", easy: 20, medium: 35, hard: 40, accuracy: 89, lastActive: "2 days ago"},
  { id: 6,  name: "Divya Nair",      class: "12-A", easy: 48, medium: 27, hard: 15, accuracy: 95, lastActive: "Today"     },
  { id: 7,  name: "Ankit Verma",     class: "11-A", easy: 25, medium: 44, hard: 31, accuracy: 90, lastActive: "Yesterday" },
  { id: 8,  name: "Pooja Reddy",     class: "12-B", easy: 60, medium: 18, hard: 8,  accuracy: 97, lastActive: "Today"     },
  { id: 9,  name: "Rahul Joshi",     class: "11-B", easy: 35, medium: 30, hard: 20, accuracy: 92, lastActive: "3 days ago"},
  { id: 10, name: "Meera Iyer",      class: "12-A", easy: 44, medium: 33, hard: 16, accuracy: 94, lastActive: "Today"     },
];

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [clsFilter, setClsFilter] = useState("All");

  const classes = ["All", ...Array.from(new Set(STUDENTS.map(s => s.class)))];

  const filtered = STUDENTS.filter(s => {
    const matchName = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCls  = clsFilter === "All" || s.class === clsFilter;
    return matchName && matchCls;
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Students</h2>
        <p className="text-sm text-gray-400 mt-1">Overview of all students and their question performance.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Students", value: STUDENTS.length, icon: User, bg: "bg-purple-100", color: "text-purple-600" },
          { label: "Avg Accuracy",   value: `${Math.round(STUDENTS.reduce((a, s) => a + s.accuracy, 0) / STUDENTS.length)}%`, icon: TrendingUp, bg: "bg-green-100", color: "text-green-600" },
          { label: "Active Today",   value: STUDENTS.filter(s => s.lastActive === "Today").length, icon: CheckCircle2, bg: "bg-blue-100", color: "text-blue-600" },
          { label: "Avg Hard Qs",    value: Math.round(STUDENTS.reduce((a, s) => a + s.hard, 0) / STUDENTS.length), icon: TrendingUp, bg: "bg-red-100", color: "text-red-500" },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.bg}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{card.label}</p>
              <p className="text-2xl font-extrabold text-gray-900">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter row */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <select value={clsFilter} onChange={e => setClsFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
          {classes.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/70">
                {["Student", "Class", "Easy", "Medium", "Hard", "Accuracy", "Last Active"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-gray-50 hover:bg-purple-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm font-bold shrink-0">
                        {s.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{s.class}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">{s.easy}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-orange-500">{s.medium}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-red-500">{s.hard}</td>
                  <td className="px-4 py-3 min-w-[110px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-purple-500" style={{ width: `${s.accuracy}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-600">{s.accuracy}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{s.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
