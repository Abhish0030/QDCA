export const DASHBOARD_PAGE_ROUTES = {
  Dashboard: "/dashboard",
  Activity: "/activity",
  "Classify Question": "/classify-question",
  "Doc Analyzer": "/doc-analyzer",
  "Question History": "/question-history",
  Analytics: "/analytics",
  "Similar Questions": "/similar-questions",
  "Study Roadmap": "/study-roadmap",
  Settings: "/settings",
  "Help & Support": "/help-support",
  Profile: "/profile",
  Students: "/students",
  Reports: "/reports",
  Billing: "/billing",
  "User Management": "/user-management",
  "System Analytics": "/system-analytics",
};

const PATH_TO_PAGE = new Map(
  Object.entries(DASHBOARD_PAGE_ROUTES).map(([page, path]) => [path, page]),
);

export function getDashboardPath(page) {
  return DASHBOARD_PAGE_ROUTES[page] || DASHBOARD_PAGE_ROUTES.Dashboard;
}

export function getDashboardPage(pathname, fallback = "Dashboard") {
  return PATH_TO_PAGE.get(pathname) || fallback;
}
