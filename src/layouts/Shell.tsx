import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Activity,
  Building2,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  ScrollText,
} from 'lucide-react';
import { useAuth } from '../auth';
import { BrandMark } from '../components/BrandMark';
import { IntegrationModeTabs } from '../components/IntegrationModeTabs';
import type { IntegrationMode } from '../lib/api';

const praAdminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  {
    to: '/admin/qbo-config',
    label: 'QuickBooks Online Configuration',
    icon: KeyRound,
  },
];

const fbrAdminLinks = [
  { to: '/admin/fbr', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/fbr/companies', label: 'Companies', icon: Building2 },
  {
    to: '/admin/fbr/qbo-config',
    label: 'QuickBooks Online Configuration',
    icon: KeyRound,
  },
];

export function AdminLayout({ mode = 'PRA' }: { mode?: IntegrationMode }) {
  const { user, logout, switchMode } = useAuth();
  const navigate = useNavigate();
  const links = mode === 'FBR' ? fbrAdminLinks : praAdminLinks;

  useEffect(() => {
    switchMode(mode);
  }, [mode, switchMode]);

  return (
    <div className="portal-shell dense-portal">
      <aside className="sidebar">
        <div className="brand">
          <BrandMark />
          <div className="brand-sub">Super Admin — {mode}</div>
        </div>
        <IntegrationModeTabs mode={mode} admin />
        <nav className="nav-group">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <l.icon size={15} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user-name">{user?.fullName}</div>
          <div className="sidebar-user-email">{user?.email}</div>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', color: '#fff', borderColor: 'rgba(255,255,255,.2)' }}
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
          >
            <LogOut size={14} style={{ marginRight: 6 }} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export function CustomerLayout({ mode = 'PRA' }: { mode?: IntegrationMode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qboConnected = user?.organization?.qbo?.status === 'CONNECTED';
  const base = mode === 'FBR' ? '/fbr/app' : '/app';
  const links = [
    { to: base, label: 'Overview', icon: LayoutDashboard, end: true },
    { to: `${base}/connections`, label: 'Connections', icon: Activity },
    { to: `${base}/mappings`, label: 'Keys configuration', icon: ScrollText, needsQbo: true },
    { to: `${base}/invoices`, label: 'Invoices', icon: FileText, needsQbo: true },
    { to: `${base}/logs`, label: 'Activity', icon: ScrollText },
  ];

  return (
    <div className="portal-shell dense-portal">
      <aside className="sidebar">
        <div className="brand">
          <BrandMark />
          <div className="brand-sub">Customer Workspace — {mode}</div>
        </div>
        <nav className="nav-group">
          {links
            .filter((l) => (l.needsQbo ? qboConnected : true))
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <l.icon size={15} />
                {l.label}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user-name">{user?.fullName}</div>
          <div className="sidebar-user-org">{user?.organization?.name || 'Organization'}</div>
          <div className="sidebar-user-email">{user?.email}</div>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', color: '#fff', borderColor: 'rgba(255,255,255,.2)' }}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={14} style={{ marginRight: 6 }} />
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export function FbrCustomerLayout() {
  return <CustomerLayout mode="FBR" />;
}
