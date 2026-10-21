import { Brain, Cpu, HardDrive, Server } from "lucide-react";
import StatusBadge from "../components/StatusBadge.jsx";

const SUMMARY = [
  { label: "Model Version", value: "gemma3:1b", icon: Brain, color: "text-purple-600", bg: "bg-purple-100" },
  { label: "API Status", value: "healthy", icon: Server, color: "text-green-600", bg: "bg-green-100" },
  { label: "CPU Usage", value: "42%", icon: Cpu, color: "text-yellow-600", bg: "bg-yellow-100" },
  { label: "Storage", value: "128 GB", icon: HardDrive, color: "text-blue-600", bg: "bg-blue-100" },
];

const INCIDENTS = [
  { id: 1, title: "Temporary Ollama latency spike", severity: "warning", description: "Recovered automatically after route refresh." },
  { id: 2, title: "Model warmup completed", severity: "healthy", description: "Inference pipeline returned to nominal response time." },
];

export default function AdminAiMonitoring() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">AI Monitoring</h2>
        <p className="mt-1 text-sm text-gray-400">Operational snapshot for the active model route and system resources.</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SUMMARY.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.bg}`}>
                  <Icon className={`h-5 w-5 ${item.color}`} />
                </div>
                {item.label === "API Status" ? <StatusBadge value={item.value} /> : null}
              </div>
              <p className="mt-4 text-sm text-gray-400">{item.label}</p>
              <p className="mt-1 text-2xl font-extrabold text-gray-900">{item.value}</p>
            </div>
          );
        })}
      </section>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800">Recent Model Events</h3>
        <div className="mt-4 space-y-3">
          {INCIDENTS.map((incident) => (
            <div key={incident.id} className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-800">{incident.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{incident.description}</p>
                </div>
                <StatusBadge value={incident.severity} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
