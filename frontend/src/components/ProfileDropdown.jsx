import { User, LogOut } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { authClient, clearAuthenticatedSessionCache } from "../lib/authClient.js";
import { getDisplayMeta, getDisplayName } from "../utils/userDisplay.js";

/**
 * Shared profile dropdown.
 * Props:
 *   onNavigate(page) — navigate to a page and close
 *   onClose          — close the dropdown
 *   position         — "down" (default) | "up" (sidebar, opens above)
 *   user             — { name, email, role }
 */
export default function ProfileDropdown({ onNavigate, onClose, position = "down", user }) {
  const name = getDisplayName(user);
  const meta = getDisplayMeta(user);

  function handleNav(page) {
    onClose();
    onNavigate?.(page);
  }

  async function handleSignOut() {
    onClose();

    try {
      await authClient.signOut();
    } catch {
      // Best-effort sign-out before redirect.
    } finally {
      clearAuthenticatedSessionCache();
      window.location.href = "/login";
    }
  }

  const positionClass = position === "up" ? "bottom-full left-0 mb-2" : "right-0 top-12";

  return (
    <div className={`absolute ${positionClass} z-50 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl animate-fade-in`}>
      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <UserAvatar image={user?.image} name={name} className="w-10 h-10 rounded-full shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-400 truncate">{meta}</p>
          </div>
        </div>
      </div>

      {/* View Profile only */}
      <div className="py-2">
        <button
          onClick={() => handleNav("Profile")}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-purple-50 hover:text-purple-700"
        >
          <User className="w-4 h-4" />
          View Profile
        </button>
      </div>

      {/* Sign out */}
      <div className="border-t border-gray-50 py-2">
        <button
          onClick={() => void handleSignOut()}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
