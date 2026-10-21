import { FileText } from "lucide-react";
import AnimatedNumber from "./AnimatedNumber";

export default function StatCard({ label, value, sub, subGreen, icon: Icon, iconBg, iconColor }) {
  const safeLabel = typeof label === "string" ? label : String(label ?? "");
  const safeSub = typeof sub === "string" ? sub : sub == null ? "" : String(sub);
  const SafeIcon =
    typeof Icon === "function" || (Icon && typeof Icon === "object" && "$$typeof" in Icon)
      ? Icon
      : FileText;

  return (
    <div className="flex min-h-[118px] items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
        <SafeIcon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="flex min-h-[78px] min-w-0 flex-1 flex-col justify-between">
        <p className="max-w-[11ch] text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">{safeLabel}</p>
        <p className="pt-1 text-2xl font-extrabold leading-none text-gray-900">
          <AnimatedNumber value={value} />
        </p>
        {safeSub && (
          <p className={`max-w-[16ch] pt-1 text-sm leading-5 ${subGreen ? "font-semibold text-green-600" : "font-medium text-gray-500"}`}>
            {subGreen && "↗ "}{safeSub}
          </p>
        )}
      </div>
    </div>
  );
}
