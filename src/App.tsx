import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import { AdminLayout, CustomerLayout } from './layouts/Shell';
import {
  AdminLoginPage,
  CustomerLoginPage,
  LandingPage,
  RegisterPage,
  ResetPasswordRequestPage,
  ResetPasswordOtpPage,
  ResetPasswordUpdatePage,
} from './pages/AuthPages';
import {
  AdminOverviewPage,
  CustomerBranchesPage,
  CustomerConnectionsPage,
  CustomerDashboardPage,
  CustomerInvoicesPage,
  CustomerLogsPage,
  CustomerMappingsPage,
} from './pages/Portals';
import {
  AdminCompaniesListPage,
  AdminCompanyCreatePage,
  AdminCompanyDetailPage,
} from './pages/AdminCompanies';
import { AdminQboConfigPage } from './pages/AdminQboConfig';
import { FiscalInvoiceReportPage } from './pages/FiscalInvoiceReport';
import { InvoiceDetailPage } from './pages/InvoiceDetail';
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
        <Route path="/reset-password" element={<ResetPasswordRequestPage />} />
        <Route path="/reset-password/otp" element={<ResetPasswordOtpPage />} />
        <Route path="/reset-password/update" element={<ResetPasswordUpdatePage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        <Route element={<Guard portal="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="companies" element={<AdminCompaniesListPage />} />
            <Route path="companies/new" element={<AdminCompanyCreatePage />} />
            <Route path="companies/:id" element={<AdminCompanyDetailPage />} />
            <Route path="qbo-config" element={<AdminQboConfigPage />} />
            <Route path="organizations" element={<Navigate to="/admin/companies" replace />} />
          </Route>
        </Route>

        <Route element={<Guard portal="customer" />}>
          <Route path="/app" element={<CustomerLayout />}>
            <Route index element={<CustomerDashboardPage />} />
            <Route path="connections" element={<CustomerConnectionsPage />} />
            <Route path="mappings" element={<CustomerMappingsPage />} />
            <Route path="branches" element={<CustomerBranchesPage />} />
            <Route path="invoices" element={<CustomerInvoicesPage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="invoices/:id/print" element={<FiscalInvoiceReportPage />} />
            <Route path="logs" element={<CustomerLogsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
