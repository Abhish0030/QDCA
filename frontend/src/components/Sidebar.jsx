import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard, PenLine, FileText, History, BarChart2,
  Search, Map, Settings, HelpCircle, ChevronDown, X, ShieldCheck,
  Users, Upload, FileQuestion,
  Activity,
} from "lucide-react";
import { navItems } from "../data";
import qdcaLogo from "../assets/qdca-logo-new.png";
import ProfileDropdown from "./ProfileDropdown";
import UserAvatar from "./UserAvatar";
import { getDisplayMeta, getDisplayName, getDisplayRole } from "../utils/userDisplay.js";

// Icon map covers both user and admin nav labels
const iconMap = {
  // User nav
  "Dashboard":         LayoutDashboard,
  "Activity":          Activity,
  "Classify Question": PenLine,
  "Doc Analyzer":      FileText,
  "Question History":  History,
  "Analytics":         BarChart2,
  "Similar Questions": Search,
  "Study Roadmap":     Map,
  "Settings":          Settings,
  "Help & Support":    HelpCircle,
  // Admin nav
  "Users":             Users,
  "Questions":         FileQuestion,
  "Uploads":           Upload,
};

function useOutsideClick(ref, handler) {
  useEffect(() => {
    function listener(e) {
      if (ref.current && !ref.current.contains(e.target)) handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler]);
}

export default function Sidebar({
  open,
  onClose,
  activePage,
  setActivePage,
  onNavigate,
  user,
  adminMode = false,
  adminNavItems,   // when adminMode=true, pass admin-specific nav items array
  isDesktop = false,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useOutsideClick(profileRef, () => setProfileOpen(false));

  useEffect(() => {
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") {
        if (profileOpen) { setProfileOpen(false); return; }
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, open, profileOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    if (isDesktop || !open) {
      document.body.style.overflow = "";
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDesktop, open]);

  function handleNav(page) {
    setProfileOpen(false);
    setActivePage?.(page);
    onNavigate?.(page);
  }

  // In admin mode use provided adminNavItems; in user mode use navItems from data
  const items = adminMode && adminNavItems ? adminNavItems : navItems;

  const displayName = getDisplayName(user);
  const displayRole = getDisplayRole(user);
  const displayMeta = getDisplayMeta(user);

  return (
    <>
      {!isDesktop && open && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : -288, opacity: open ? 1 : 0.98 }}
        transition={{ type: "spring", stiffness: 360, damping: 36, mass: 0.9 }}
        className="fixed top-0 left-0 z-50 flex h-full w-[272px] flex-col border-r border-gray-100 bg-white shadow-xl will-change-transform"
        aria-label={adminMode ? "Admin Navigation" : "Navigation"}
        aria-hidden={!open}
      >
        {/* ── Logo row ─────────────────────────────────────── */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-gray-100 px-5">
          <button
            type="button"
            onClick={() => handleNav("Dashboard")}
            className="flex items-center gap-2 rounded-2xl transition-opacity hover:opacity-90"
            aria-label="Go to dashboard"
          >
            <img src={qdcaLogo} alt="QDCA Logo" className="h-10 w-auto shrink-0 object-contain" />
            <span className="text-[2rem] font-extrabold leading-none tracking-tight text-qdca-purple">QDCA</span>
            {adminMode && (
              <span className="ml-0.5 inline-flex items-center rounded-full bg-purple-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                Admin
              </span>
            )}
          </button>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="Close menu">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* ── Nav ──────────────────────────────────────────── */}
        <nav className="flex-1 space-y-1.5 overflow-x-hidden overflow-y-auto p-4">
          {items.map(({ label }) => {
            const Icon = iconMap[label];
            const isActive = activePage === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleNav(label)}
                className={`
                  w-full flex items-center gap-3 rounded-2xl px-4 py-3
                  text-[15px] font-medium transition-all
                  ${isActive
                    ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                    : "text-gray-500 hover:bg-purple-50 hover:text-purple-700"}
                `}
              >
                {Icon && <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />}
                <span className="truncate">{label}</span>
              </button>
            );
          })}

          {/* Admin Panel link — only in user mode, only for admin email */}
          {!adminMode && user?.email && user.email === "admin123@gmail.com" && (
            <>
              <div className="flex items-center gap-2 px-4 pb-1 pt-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Admin</span>
              </div>
              <a href="/admin" onClick={onClose} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-[15px] font-medium text-gray-500 transition-all hover:bg-purple-50 hover:text-purple-700">
                <ShieldCheck className="h-5 w-5 shrink-0 text-gray-400" />
                <span className="truncate">Admin Panel</span>
              </a>
            </>
          )}
        </nav>

        {/* ── Profile ──────────────────────────────────────── */}
        <div className="relative shrink-0 border-t border-gray-100 p-4" ref={profileRef}>
          {profileOpen && (
            <ProfileDropdown
              position="up"
              onNavigate={handleNav}
              onClose={() => setProfileOpen(false)}
              user={user}
            />
          )}
          <button
            onClick={() => setProfileOpen(v => !v)}
            className="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-white p-3 transition-all hover:border-gray-100 hover:bg-gray-50 hover:shadow-sm"
          >
            <UserAvatar
              image={user?.image}
              name={displayName}
              className="h-11 w-11 rounded-full shrink-0 ring-2 ring-purple-100"
              fallbackClassName="text-sm"
            />
            <div className="flex-1 min-w-0 text-left">
              <p className="truncate text-[14px] font-semibold text-gray-900">{displayName}</p>
              <p className="truncate text-[12px] text-gray-500">{displayMeta}</p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-purple-500">{displayRole}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </motion.aside>
    </>
  );
}
