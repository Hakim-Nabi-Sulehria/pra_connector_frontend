import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  {
    to: '/admin/qbo-config',
    label: 'QuickBooks Online Configuration',
    icon: KeyRound,
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="portal-shell dense-portal">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            PRA <span>Connector</span>
          </div>
          <div className="brand-sub">Super Admin Control Plane</div>
        </div>
        <nav className="nav-group">
          {adminLinks.map((l) => (
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

const customerLinks = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/connections', label: 'Connections', icon: Activity },
  { to: '/app/mappings', label: 'Keys configuration', icon: ScrollText },
  { to: '/app/invoices', label: 'Invoices', icon: FileText },
  { to: '/app/logs', label: 'Activity', icon: ScrollText },
];

export function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qboConnected = user?.organization?.qbo?.status === 'CONNECTED';

  return (
    <div className="portal-shell dense-portal">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            PRA <span>Connector</span>
          </div>
          <div className="brand-sub">Customer Workspace</div>
        </div>
        <nav className="nav-group">
          {customerLinks
            .filter((l) => (l.to === '/app/mappings' ? qboConnected : true))
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
