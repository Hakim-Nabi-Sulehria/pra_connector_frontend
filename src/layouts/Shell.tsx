import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  ScrollText,
  Users,
} from 'lucide-react';
import { useAuth } from '../auth';

const adminLinks = [
  { to: '/admin', label: 'Command Center', icon: LayoutDashboard, end: true },
  { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/invoices', label: 'Invoice Traffic', icon: FileText },
  { to: '/admin/logs', label: 'Audit Stream', icon: ScrollText },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="portal-shell">
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
              <l.icon size={18} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontWeight: 700 }}>{user?.fullName}</div>
          <div style={{ opacity: 0.7, marginBottom: 10 }}>{user?.email}</div>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', color: '#fff', borderColor: 'rgba(255,255,255,.2)' }}
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
          >
            <LogOut size={16} style={{ marginRight: 8 }} />
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
  { to: '/app/mappings', label: 'Field Mappings', icon: ScrollText },
  { to: '/app/branches', label: 'Branches', icon: Building2 },
  { to: '/app/invoices', label: 'Invoices', icon: FileText },
  { to: '/app/logs', label: 'Activity', icon: ScrollText },
];

export function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="portal-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            PRA <span>Connector</span>
          </div>
          <div className="brand-sub">Customer Workspace</div>
        </div>
        <nav className="nav-group">
          {customerLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <l.icon size={18} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontWeight: 700 }}>{user?.fullName}</div>
          <div style={{ opacity: 0.7, marginBottom: 4 }}>
            {user?.organization?.name || 'Organization'}
          </div>
          <div style={{ opacity: 0.55, marginBottom: 10, fontSize: 12 }}>{user?.email}</div>
          <button
            className="btn btn-ghost"
            style={{ width: '100%', color: '#fff', borderColor: 'rgba(255,255,255,.2)' }}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={16} style={{ marginRight: 8 }} />
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
