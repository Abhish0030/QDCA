import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BarChart2, CheckCircle2, FileText, Loader2, TrendingUp } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import ClassifyModal from "../components/ClassifyModal";
import AdminRoute from "../components/AdminRoute";
import {
  fetchDashboardOverview,
  fetchSettings,
  fetchStats,
  openChatbot,
  updateProfileImage,
  uploadPDF,
  USER_ACTIVITY_REFRESH_EVENT,
} from "../api";
import { readSessionCache, writeSessionCache } from "../utils/cache";
import { ROLES } from "../utils/roles";
import { authClient } from "../lib/authClient.js";
import { getDashboardPage, getDashboardPath } from "../utils/dashboardRoutes.js";
import { hasAdminPrivileges } from "../utils/adminConfig.js";

// Pages
import DashboardPage from "./DashboardPage";
import ActivityPage from "./ActivityPage";
import ClassifyQuestionPage from "./ClassifyQuestionPage";
import PDFAnalyzerPage from "./PDFAnalyzerPage";
import QuestionHistoryPage from "./QuestionHistoryPage";

const AnalyticsPage = lazy(() => import("./AnalyticsPage"));
const SimilarQuestionsPage = lazy(() => import("./SimilarQuestionsPage"));
const StudyRoadmapPage = lazy(() => import("./StudyRoadmapPage"));
const StudentsPage = lazy(() => import("./StudentsPage"));
const ReportsPage = lazy(() => import("./ReportsPage"));
const SettingsPage = lazy(() => import("./SettingsPage"));
const BillingPage = lazy(() => import("./BillingPage"));
const HelpPage = lazy(() => import("./HelpPage"));
const UserManagement = lazy(() => import("./UserManagement"));
const SystemAnalytics = lazy(() => import("./SystemAnalytics"));
const UserProfilePage = lazy(() => import("./UserProfilePage"));

function buildStats(data) {
  const total = data.total || 1;
  const difficultyCards = [
    ["Very Easy", data.veryEasy, CheckCircle2, "bg-green-100", "text-green-700"],
    ["Easy", data.easy, CheckCircle2, "bg-lime-100", "text-lime-700"],
    ["Medium", data.medium, BarChart2, "bg-yellow-100", "text-yellow-700"],
    ["Hard", data.hard, TrendingUp, "bg-orange-100", "text-orange-600"],
    ["Expert", data.expert, TrendingUp, "bg-red-100", "text-red-600"],
  ];
  return [
    {
      label: "Total Questions",
      value: Number(data.total).toLocaleString(),
      sub: `${Number(data.accuracy || 0)}% avg confidence`,
      subGreen: false,
      icon: FileText,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    ...difficultyCards.map(([label, value = 0, icon, iconBg, iconColor]) => ({
      label: `${label} Questions`,
      value: Number(value).toLocaleString(),
      sub: `${((Number(value) / total) * 100).toFixed(1)}% of total`,
      subGreen: false,
      icon,
      iconBg,
      iconColor,
    })),
  ];
}

export default function Dashboard({ initialPage = "Dashboard" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const cachedStatsData = readSessionCache("qdca:dashboard:stats-data");
  const cachedOverviewData = readSessionCache("qdca:dashboard:overview");
  const cachedUserData = readSessionCache("qdca:current-user");
  const [isDesktop,    setIsDesktop]    = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 768px)").matches;
  });
  const [drawerOpen,   setDrawerOpen]   = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 768px)").matches;
  });
  const [activePage,   setActivePage]   = useState(() => getDashboardPage(location.pathname, initialPage));
  const [stats,        setStats]        = useState(() => (cachedStatsData ? buildStats(cachedStatsData) : null));
  const [loading,      setLoading]      = useState(() => !cachedStatsData);
  const [statsError,   setStatsError]   = useState("");
  const [overview,     setOverview]     = useState(() => cachedOverviewData || null);
  const [overviewLoading, setOverviewLoading] = useState(() => !cachedOverviewData);
  const [overviewError, setOverviewError] = useState("");
  const [classifyOpen, setClassifyOpen] = useState(false);
  const [refreshKey,   setRefreshKey]   = useState(0);
  const [toast,        setToast]        = useState("");
  const [role,         setRoleState]    = useState(ROLES.USER);
  const lastDashboardRefreshRef = useRef(0);
  const fileRef = useRef(null);

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

  // currentUser as state — updated by profile page so sidebar/header react instantly
  const [currentUser, setCurrentUser] = useState(() => ({
    id:         "",
    name:       "",
    email:      "",
    image:      "",
    phone:      "",
    university: "",
    department: "",
    semester:   "",
    studentId:  "",
    role,
    ...(cachedUserData || {}),
  }));

  // Sync name/email from real session when available
  useEffect(() => {
    if (session?.user) {
      const sessionRole = hasAdminPrivileges(session.user) ? ROLES.ADMIN : ROLES.USER;
      setRoleState(sessionRole);
      setCurrentUser(u => {
        const nextUser = {
          ...u,
          id: session.user.id || u.id,
          name:  session.user.name  || u.name,
          email: session.user.email || u.email,
          image: session.user.image || u.image,
          role: sessionRole,
        };
        writeSessionCache("qdca:current-user", nextUser);
        return nextUser;
      });
    }
  }, [session]);

  useEffect(() => {
    let active = true;
    let timeoutId = null;

    const hasCachedProfile =
      Boolean(cachedUserData?.phone) ||
      Boolean(cachedUserData?.university) ||
      Boolean(cachedUserData?.department) ||
      Boolean(cachedUserData?.studentId);

    async function hydrateUserProfile() {
      try {
        const data = await fetchSettings();
        if (!active || !data) return;

        const nextUser = {
          id: data.account?.id || session?.user?.id || "",
          name: data.profile?.name || session?.user?.name || "",
          email: data.profile?.email || session?.user?.email || "",
          image: data.profile?.image || session?.user?.image || "",
          phone: data.profile?.phone || "",
          university: data.profile?.university || "",
          department: data.profile?.department || "",
          semester: data.profile?.semester || "",
          studentId: data.profile?.studentId || data.profile?.username || "",
          role: hasAdminPrivileges({
            role: data.account?.role || session?.user?.role || ROLES.USER,
            email: data.profile?.email || session?.user?.email || "",
          })
            ? ROLES.ADMIN
            : ROLES.USER,
        };

        setCurrentUser((current) => ({ ...current, ...nextUser }));
        writeSessionCache("qdca:current-user", nextUser);
      } catch {
        // Best effort hydration for refreshes; session values and cache remain available.
      }
    }

    if (!hasCachedProfile) {
      timeoutId = window.setTimeout(() => {
        void hydrateUserProfile();
      }, 250);
    }

    return () => {
      active = false;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    cachedUserData?.department,
    cachedUserData?.phone,
    cachedUserData?.studentId,
    cachedUserData?.university,
    session?.user?.email,
    session?.user?.id,
    session?.user?.image,
    session?.user?.name,
    session?.user?.role,
  ]);

  useEffect(() => {
    setActivePage(getDashboardPage(location.pathname, initialPage));
  }, [initialPage, location.pathname]);

  function handlePageChange(page, options = {}) {
    const nextPath = getDashboardPath(page);
    setActivePage(page);
    if (location.pathname !== nextPath) {
      navigate(nextPath, options);
    }
  }

  async function handleUpdateUser(updates) {
    const { __localOnly, ...userUpdates } = updates ?? {};
    const accountUpdates = {};
    if (Object.hasOwn(userUpdates, "name")) accountUpdates.name = userUpdates.name;

    if (!__localOnly && Object.hasOwn(userUpdates, "image")) {
      await updateProfileImage(userUpdates.image);
    }

    if (!__localOnly && Object.keys(accountUpdates).length) {
      const result = await authClient.updateUser(accountUpdates);
      if (result.error) throw new Error(result.error.message || "Could not update your profile.");
    }

    setCurrentUser(u => {
      const nextUser = { ...u, ...userUpdates };
      writeSessionCache("qdca:current-user", nextUser);
      return nextUser;
    });
  }

  function handleRoleChange(newRole) {
    if (newRole !== role) showToast("Roles can only be changed by an administrator.");
  }

  function refresh() { setRefreshKey(k => k + 1); }
  function openAssistant() { openChatbot(); }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }

  // Show toast if redirected from admin panel due to insufficient role
  useEffect(() => {
    try {
      if (sessionStorage.getItem('adminAccessDenied')) {
        sessionStorage.removeItem('adminAccessDenied');
        showToast("⛔ Admin access required. Switch your role to Admin in Settings.");
      }
    } catch {
      // sessionStorage may be unavailable in restricted browser contexts.
    }
  }, []);

  useEffect(() => {
    let active = true;
    const DASHBOARD_REFRESH_DEBOUNCE_MS = 10_000;
    const shouldLoadOverview = activePage === "Dashboard";

    async function loadDashboardData({ force = false, showLoader = false } = {}) {
      const now = Date.now();
      if (!force && now - lastDashboardRefreshRef.current < DASHBOARD_REFRESH_DEBOUNCE_MS) {
        return;
      }
      lastDashboardRefreshRef.current = now;

      if (showLoader) {
        setLoading(true);
        if (shouldLoadOverview) {
          setOverviewLoading(true);
        }
      }

      const [statsResult, overviewResult] = await Promise.allSettled([
        fetchStats(),
        shouldLoadOverview ? fetchDashboardOverview() : Promise.resolve(overview),
      ]);

      if (!active) return;

      if (statsResult.status === "fulfilled") {
        const nextStats = buildStats(statsResult.value);
        setStats(nextStats);
        setStatsError("");
        writeSessionCache("qdca:dashboard:stats-data", statsResult.value);
      } else {
        setStats([]);
        setStatsError(
          statsResult.reason?.message || "Dashboard data unavailable. Check the backend connection.",
        );
        showToast("Dashboard data unavailable. Check the backend connection.");
      }

      if (shouldLoadOverview && overviewResult.status === "fulfilled") {
        setOverview(overviewResult.value);
        setOverviewError("");
        writeSessionCache("qdca:dashboard:overview", overviewResult.value);
      } else if (shouldLoadOverview) {
        setOverview(null);
        setOverviewError(
          overviewResult.reason?.message || "Could not load the dashboard overview.",
        );
      }

      setLoading(false);
      if (shouldLoadOverview) {
        setOverviewLoading(false);
      }
    }

    const startRefresh = () => {
      if (cachedStatsData || (shouldLoadOverview && cachedOverviewData)) {
        return window.setTimeout(() => {
          void loadDashboardData({ force: true });
        }, 150);
      }

      void loadDashboardData({ force: true, showLoader: true });
      return null;
    };

    const timeoutId = startRefresh();
    const handleUserActivityRefresh = () => {
      void loadDashboardData();
    };
    const handleFocusRefresh = () => {
      void loadDashboardData();
    };
    const intervalId = window.setInterval(() => {
      void loadDashboardData();
    }, 30000);
    window.addEventListener(USER_ACTIVITY_REFRESH_EVENT, handleUserActivityRefresh);
    window.addEventListener("focus", handleFocusRefresh);

    return () => {
      active = false;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      window.clearInterval(intervalId);
      window.removeEventListener(USER_ACTIVITY_REFRESH_EVENT, handleUserActivityRefresh);
      window.removeEventListener("focus", handleFocusRefresh);
    };
  }, [activePage, cachedOverviewData, cachedStatsData, overview, refreshKey]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    showToast("⏳ Uploading document…");
    try {
      const data = await uploadPDF(file);
      showToast(`✅ ${data.upload.name} — ${data.upload.questions} questions extracted`);
      refresh();
      } catch (error) {
        showToast(`❌ ${error?.message || "Upload failed. Supported files: PDF, PNG, JPG, JPEG, DOC, DOCX, and CSV up to 20 MB."}`);
      }
    }

  function renderPage() {
    switch (activePage) {
      case "Dashboard":         return <DashboardPage stats={stats} loading={loading} error={statsError} overview={overview} overviewLoading={overviewLoading} overviewError={overviewError} refreshKey={refreshKey} onNavigate={handlePageChange} onOpenChatbot={openAssistant} />;
      case "Activity":          return <ActivityPage refreshKey={refreshKey} />;
      case "Classify Question": return <ClassifyQuestionPage onSuccess={refresh} />;
      case "Doc Analyzer":      return <PDFAnalyzerPage onSuccess={refresh} onNavigate={handlePageChange} />;
      case "Question History":  return <QuestionHistoryPage refreshKey={refreshKey} />;
      case "Analytics":         return <AnalyticsPage refreshKey={refreshKey} />;
      case "Similar Questions": return <SimilarQuestionsPage />;
      case "Study Roadmap":     return <StudyRoadmapPage user={currentUser} onNavigate={handlePageChange} />;
      case "Students":          return <StudentsPage />;
      case "Reports":           return <ReportsPage />;
      case "Billing":           return <BillingPage />;
      case "Help & Support":    return <HelpPage onOpenChatbot={openAssistant} />;
      case "Settings":
        return <SettingsPage user={currentUser} onUpdateUser={handleUpdateUser} onRoleChange={handleRoleChange} />;
      case "Profile":
        return <UserProfilePage user={currentUser} onUpdateUser={handleUpdateUser} onNavigate={handlePageChange} />;
      case "User Management":
        return (
          <AdminRoute role={currentUser.role} onRedirect={handlePageChange}>
            <UserManagement />
          </AdminRoute>
        );
      case "System Analytics":
        return (
          <AdminRoute role={currentUser.role} onRedirect={handlePageChange}>
            <SystemAnalytics />
          </AdminRoute>
        );
      default:
        return <DashboardPage stats={stats} loading={loading} error={statsError} overview={overview} overviewLoading={overviewLoading} overviewError={overviewError} refreshKey={refreshKey} onNavigate={handlePageChange} onOpenChatbot={openAssistant} />;
    }
  }

  return (
    <div className="min-h-screen bg-qdca-bg">
      <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.csv" className="hidden" onChange={handleFileChange} />

      <Sidebar
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activePage={activePage}
        setActivePage={setActivePage}
        onNavigate={handlePageChange}
        user={currentUser}
        isDesktop={isDesktop}
      />

      <motion.div
        initial={{ marginLeft: 0 }}
        animate={{ marginLeft: isDesktop && drawerOpen ? 272 : 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 36, mass: 0.9 }}
        className="min-h-screen flex flex-col"
      >
        <Header
          onMenuClick={() => setDrawerOpen(v => !v)}
          onClassify={() => setClassifyOpen(true)}
          onUploadPDF={() => fileRef.current?.click()}
          userName={currentUser.name}
        />

        {toast && (
          <div className="mx-4 mt-3 md:mx-6 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
            {toast}
          </div>
        )}

        <main className="flex-1 p-4 md:p-6">
          <Suspense fallback={<DashboardPageSkeleton page={activePage} />}>
            {renderPage()}
          </Suspense>
        </main>
      </motion.div>

      <ClassifyModal
        open={classifyOpen}
        onClose={() => setClassifyOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
}

function DashboardPageSkeleton({ page }) {
  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-gray-100 bg-white px-5 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff3f5]">
            <Loader2 className="h-5 w-5 animate-spin text-[#FF385C]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Loading {page}</p>
            <p className="mt-1 text-xs text-gray-500">Preparing the next dashboard view...</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-40 animate-pulse rounded-3xl border border-gray-100 bg-white shadow-sm" />
        <div className="h-40 animate-pulse rounded-3xl border border-gray-100 bg-white shadow-sm" />
        <div className="h-40 animate-pulse rounded-3xl border border-gray-100 bg-white shadow-sm" />
      </div>
      <div className="h-72 animate-pulse rounded-3xl border border-gray-100 bg-white shadow-sm" />
    </div>
  );
}
