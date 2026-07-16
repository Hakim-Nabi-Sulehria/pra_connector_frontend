import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { AdminLayout, CustomerLayout } from './layouts/Shell';
import {
  AdminLoginPage,
  CustomerLoginPage,
  LandingPage,
  RegisterPage,
} from './pages/AuthPages';
import {
  AdminInvoicesPage,
  AdminLogsPage,
  AdminOrganizationsPage,
  AdminOverviewPage,
  AdminUsersPage,
  CustomerBranchesPage,
  CustomerConnectionsPage,
  CustomerDashboardPage,
  CustomerInvoicesPage,
  CustomerLogsPage,
  CustomerMappingsPage,
} from './pages/Portals';
import { PrivacyPage, TermsPage } from './pages/LegalPages';

function Guard({ portal }: { portal: 'admin' | 'customer' }) {
  const { user, loading, portal: active } = useAuth();
  if (loading) return <p style={{ padding: 40 }}>Loading session…</p>;
  if (!user || active !== portal) {
    return <Navigate to={portal === 'admin' ? '/admin/login' : '/login'} replace />;
  }
  if (portal === 'admin' && user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/login" replace />;
  }
  if (portal === 'customer' && user.role === 'SUPER_ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/login" element={<CustomerLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        <Route element={<Guard portal="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="organizations" element={<AdminOrganizationsPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="invoices" element={<AdminInvoicesPage />} />
            <Route path="logs" element={<AdminLogsPage />} />
          </Route>
        </Route>

        <Route element={<Guard portal="customer" />}>
          <Route path="/app" element={<CustomerLayout />}>
            <Route index element={<CustomerDashboardPage />} />
            <Route path="connections" element={<CustomerConnectionsPage />} />
            <Route path="mappings" element={<CustomerMappingsPage />} />
            <Route path="branches" element={<CustomerBranchesPage />} />
            <Route path="invoices" element={<CustomerInvoicesPage />} />
            <Route path="logs" element={<CustomerLogsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
