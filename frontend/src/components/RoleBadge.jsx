import { ROLES } from "../utils/roles";

export default function RoleBadge({ role }) {
  const isAdmin = role === ROLES.ADMIN;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide
      ${isAdmin ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
      {isAdmin ? "Admin" : "User"}
    </span>
  );
}
