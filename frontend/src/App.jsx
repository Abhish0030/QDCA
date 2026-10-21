import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminProtectedRoute from './components/AdminProtectedRoute.jsx';
import PageLoader from './components/PageLoader.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { DASHBOARD_PAGE_ROUTES } from './utils/dashboardRoutes.js';
import TermsOfService from './pages/TermsOfService.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const AdminLayout = lazy(() => import('./features/admin/layouts/AdminLayout.jsx'));
const SignupPage = lazy(() => import('./pages/SignupPage.jsx'));
const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const AiChatbot = lazy(() => import('./components/AiChatbot.jsx'));

const dashboardRoutes = Object.values(DASHBOARD_PAGE_ROUTES);
const routeFallback = <PageLoader />;

function withRouteSuspense(children) {
  return <Suspense fallback={routeFallback}>{children}</Suspense>;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={withRouteSuspense(<LandingPage />)} />
        <Route path="/signup" element={withRouteSuspense(<SignupPage />)} />
        <Route path="/login" element={withRouteSuspense(<SignupPage />)} />
        <Route path="/forgot-password" element={withRouteSuspense(<ForgotPassword />)} />
        <Route path="/reset-password" element={withRouteSuspense(<ResetPassword />)} />
        {dashboardRoutes.map(path => (
          <Route
            key={path}
            path={path}
            element={withRouteSuspense(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />
        ))}
        <Route
          path="/admin/*"
          element={withRouteSuspense(
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          )}
        />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
      <Suspense fallback={null}>
        <AiChatbot />
      </Suspense>
    </>
  );
}

export default App;
