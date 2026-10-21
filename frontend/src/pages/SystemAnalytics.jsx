import { Users, UserCheck, FileText, Upload, Brain, Activity } from "lucide-react";

const STATS = [
  { label: "Total Users",     value: "1,284",  sub: "+12 this week",    subGreen: true,  icon: Users,      iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { label: "Active Users",    value: "947",    sub: "73.7% of total",   subGreen: true,  icon: UserCheck,  iconBg: "bg-green-100",  iconColor: "text-green-600"  },
  { label: "Total Questions", value: "10,248", sub: "12.5% this month", subGreen: true,  icon: FileText,   iconBg: "bg-blue-100",   iconColor: "text-blue-600"   },
  { label: "PDFs Uploaded",   value: "3,512",  sub: "+48 today",        subGreen: true,  icon: Upload,     iconBg: "bg-yellow-100", iconColor: "text-yellow-600" },
  { label: "Model Accuracy",  value: "95.4%",  sub: "3.2% improvement", subGreen: true,  icon: Brain,      iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
];

const RECENT_ACTIVITY = [
  { user: "Priya Sharma", action: "Uploaded NEET_PYQ_2024.pdf",          time: "2 min ago",  color: "bg-blue-500"   },
  { user: "Rahul Mehta",  action: "Classified 12 questions",              time: "8 min ago",  color: "bg-purple-500" },
  { user: "Sara Ahmed",   action: "Generated analytics report",           time: "15 min ago", color: "bg-green-500"  },
  { user: "David Kim",    action: "Updated account settings",             time: "32 min ago", color: "bg-yellow-500" },
  { user: "Carlos Ruiz",  action: "Uploaded Board_Exam_Science.pdf",      time: "1 hr ago",   color: "bg-blue-500"   },
  { user: "Aisha Patel",  action: "Account deactivated by admin",         time: "2 hr ago",   color: "bg-red-500"    },
];

export default function SystemAnalytics() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">System Analytics</h2>
        <p className="text-sm text-gray-400 mt-1">Platform-wide usage overview and recent activity.</p>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 leading-tight">{s.label}</p>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg}`}>
                  <Icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
              <p className={`text-xs mt-1 font-medium ${s.subGreen ? "text-green-600" : "text-gray-400"}`}>{s.sub}</p>
            </div>
          );
        })}
      </section>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-purple-600" />
          <h3 className="font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <div className="space-y-3">
          {RECENT_ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${a.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{a.user}</span>
                  {" — "}
                  <span className="text-gray-500">{a.action}</span>
                </p>
              </div>
              <span className="text-xs text-gray-400 shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
