import { ShieldCheck, UserCircle2 } from "lucide-react";
import { getDisplayMeta, getDisplayName, getDisplayRole } from "../../../utils/userDisplay.js";

export default function AdminProfile({ admin = {} }) {
  const displayName = getDisplayName(admin);
  const displayRole = getDisplayRole(admin);
  const accountStatus = admin.status || "active";

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-10">
      <div>
        <h2 className="text-xl font-bold text-gray-900">My Admin Profile</h2>
        <p className="mt-1 text-sm text-gray-400">Session-backed administrator details only. Unsupported profile metadata stays hidden until real backend fields exist.</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FF385C] text-3xl font-bold text-white">
            {displayName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-extrabold text-gray-900">{displayName}</h3>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                {displayRole}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{getDisplayMeta(admin)}</p>
            <p className="mt-1 text-xs text-gray-400">Only active session-backed fields are shown here.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <UserCircle2 className="h-4 w-4 text-[#FF385C]" />
            Profile Information
          </h3>
          <div className="space-y-4">
            <DetailRow label="Name" value={displayName} />
            <DetailRow label="Email" value={admin.email || "Not available"} />
            <DetailRow label="Avatar" value={admin.image ? "Connected" : "No profile image"} />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-800">
            <ShieldCheck className="h-4 w-4 text-[#FF385C]" />
            Account Details
          </h3>
          <DetailRow label="User ID" value={admin.id || "Not available"} />
          <DetailRow label="Role" value={displayRole} />
          <DetailRow label="Status" value={accountStatus} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#FFE1E7] bg-[#FFF7F9] p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-800">What is intentionally not shown</h3>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          Phone numbers, departments, member-since dates, last-password-change timestamps, and admin activity summaries were removed here because the live admin route does not currently have a truthful backend source for them.
        </p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-3 last:border-0">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-right text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}
