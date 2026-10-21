import { lazy, Suspense, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../../../lib/authClient.js";
import PageLoader from "../../../components/PageLoader.jsx";
import Sidebar from "../../../components/Sidebar.jsx";
import Header from "../../../components/Header.jsx";
import { getDisplayName } from "../../../utils/userDisplay.js";
import { hasAdminPrivileges } from "../../../utils/adminConfig.js";

const AdminDashboard = lazy(() => import("../pages/AdminDashboard.jsx"));
const AdminUsers = lazy(() => import("../pages/AdminUsers.jsx"));
const AdminQuestions = lazy(() => import("../pages/AdminQuestions.jsx"));
const AdminUploads = lazy(() => import("../pages/AdminUploads.jsx"));
const AdminAnalytics = lazy(() => import("../pages/AdminAnalytics.jsx"));
const AdminSettings = lazy(() => import("../pages/AdminSettings.jsx"));
const AdminProfile = lazy(() => import("../pages/AdminProfile.jsx"));

const ADMIN_NAV = [
  { label: "Dashboard", adminOnly: false },
  { label: "Users", adminOnly: false },
  { label: "Questions", adminOnly: false },
  { label: "Uploads", adminOnly: false },
  { label: "Analytics", adminOnly: false },
  { label: "Settings", adminOnly: false },
];

const HEADER_CONFIG = {
  Dashboard: { subtitle: "Platform overview and management.", primaryLabel: null, secondaryLabel: null },
  Users: { subtitle: "Manage user accounts and permissions.", primaryLabel: null, secondaryLabel: null },
  Questions: { subtitle: "Review and override classifications.", primaryLabel: null, secondaryLabel: null },
  Uploads: { subtitle: "Monitor indexed document sources.", primaryLabel: null, secondaryLabel: null },
  Analytics: { subtitle: "Platform-wide usage trends and metrics.", primaryLabel: null, secondaryLabel: null },
  Settings: { subtitle: "Configure platform and AI model.", primaryLabel: null, secondaryLabel: null },
  Profile: { subtitle: "Your administrator account details.", primaryLabel: null, secondaryLabel: null },
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 768px)").matches;
  });
  const [drawerOpen, setDrawerOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 768px)").matches;
  });
  const [activePage, setActivePage] = useState("Dashboard");
  const [currentAdmin, setCurrentAdmin] = useState({
    id: "",
    name: "",
    email: "",
    image: "",
    role: "admin",
    status: "",
  });

  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const handleChange = (event) => {
      setIsDesktop(event.matches);
      setDrawerOpen(event.matches);
    };

    setIsDesktop(mediaQuery.matches);
    setDrawerOpen(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (session?.user) {
      const nextIsAdmin = hasAdminPrivileges(session.user);
      setCurrentAdmin((current) => ({
        ...current,
        id: session.user.id || current.id,
        name: session.user.name || getDisplayName(session.user),
        email: session.user.email || current.email,
        image: session.user.image || current.image,
        role: nextIsAdmin ? "admin" : (session.user.role || current.role),
        status: session.user.status || current.status,
      }));
    }
  }, [session]);

  useEffect(() => {
    if (session && (!hasAdminPrivileges(session.user) || session.user?.status !== "active")) {
      try {
        sessionStorage.setItem("adminAccessDenied", "1");
      } catch {
        // sessionStorage may be unavailable in restricted browser contexts.
      }
      navigate("/dashboard", { replace: true });
    }
  }, [session, navigate]);

  const cfg = HEADER_CONFIG[activePage] ?? HEADER_CONFIG.Dashboard;

  function handleNavigate(page) {
    setActivePage(page);
    if (!isDesktop) {
      setDrawerOpen(false);
    }
  }

  function renderPage() {
    switch (activePage) {
      case "Dashboard":
        return <AdminDashboard />;
      case "Users":
        return <AdminUsers />;
      case "Questions":
        return <AdminQuestions />;
      case "Uploads":
        return <AdminUploads />;
      case "Analytics":
        return <AdminAnalytics />;
      case "Settings":
        return <AdminSettings />;
      case "Profile":
        return <AdminProfile admin={currentAdmin} />;
      default:
        return <AdminDashboard />;
    }
  }

  return (
    <div className="min-h-screen bg-qdca-bg">
      <Sidebar
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activePage={activePage}
        setActivePage={setActivePage}
        onNavigate={handleNavigate}
        user={currentAdmin}
        adminMode={true}
        adminNavItems={ADMIN_NAV}
        isDesktop={isDesktop}
      />

      <div className="min-h-screen flex flex-col md:pl-[272px]">
        <Header
          onMenuClick={() => setDrawerOpen((value) => !value)}
          userName={currentAdmin.name}
          subtitle={cfg.subtitle}
          primaryLabel={cfg.primaryLabel}
          secondaryLabel={cfg.secondaryLabel}
        />

        <main className="flex-1 p-4 md:p-6">
          <Suspense fallback={<PageLoader />}>{renderPage()}</Suspense>
        </main>
      </div>
    </div>
  );
}
