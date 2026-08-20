import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  Plug,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { api } from '../lib/api';
import { PageLoader } from '../components/PageLoader';
import type { IntegrationMode } from '../lib/api';

function StatusBadge({ status }: { status?: string }) {
  const s = (status || 'DISCONNECTED').toUpperCase();
  const cls =
    s === 'CONNECTED' || s === 'POSTED'
      ? 'ok'
      : s === 'ERROR' || s === 'FAILED'
        ? 'danger'
        : 'muted';
  return <span className={`badge ${cls}`}>{s}</span>;
}

function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function donutBackground(posted: number, pending: number, failed: number) {
  const total = posted + pending + failed;
  if (!total) return 'conic-gradient(#e2e8f0 0 360deg)';
  const a = (posted / total) * 360;
  const b = a + (pending / total) * 360;
  return `conic-gradient(#0f766e 0 ${a}deg, #d97706 ${a}deg ${b}deg, #e11d48 ${b}deg 360deg)`;
}

function CoverageRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const p = pct(value, total);
  return (
    <div className="dash-coverage-row">
      <div className="dash-coverage-meta">
        <span>{label}</span>
        <strong>
          {value}/{total || 0} · {p}%
        </strong>
      </div>
      <div className="dash-h-track">
        <span style={{ width: `${p}%`, background: color }} />
      </div>
    </div>
  );
}

export function AdminDashboardPage({ mode }: { mode: IntegrationMode }) {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [error, setError] = useState('');
  const isFbr = mode === 'FBR';
  const authority = isFbr ? 'FBR' : 'PRA';
  const companiesPath = isFbr ? '/admin/fbr/companies' : '/admin/companies';
  const newCompanyPath = `${companiesPath}/new`;

  useEffect(() => {
    Promise.all([api('/admin/overview'), api<any[]>('/admin/companies')])
      .then(([overview, orgs]) => {
        setData(overview);
        setCompanies(orgs.slice(0, 6));
      })
      .catch((e) => setError(e.message));
  }, [mode]);

  const k = data?.kpis || {};
  const posted = Number(k.postedInvoices ?? 0);
  const pending = Number(k.pendingInvoices ?? 0);
  const failed = Number(k.failedInvoices ?? 0);
  const companiesCount = Number(k.companies ?? 0);
  const connectedAuthority = Number(isFbr ? k.connectedFbr ?? 0 : k.connectedPra ?? 0);
  const connectedQbo = Number(k.connectedQbo ?? 0);
  const invoiceTotal = posted + pending + failed;
  const maxBar = Math.max(posted, pending, failed, 1);

  const bars = useMemo(
    () => [
      { label: 'Posted', value: posted, color: 'var(--ok)' },
      { label: 'Pending', value: pending, color: 'var(--warn)' },
      { label: 'Failed', value: failed, color: 'var(--danger)' },
    ],
    [posted, pending, failed],
  );

  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <PageLoader label={`Loading ${authority} dashboard…`} />;

  const hero = [
    {
      label: 'Companies',
      value: companiesCount,
      hint: `${k.activeCompanies ?? 0} active`,
      icon: Building2,
      tone: '',
    },
    {
      label: 'QBO connected',
      value: connectedQbo,
      hint: `${pct(connectedQbo, companiesCount)}% coverage`,
      icon: Plug,
      tone: '',
    },
    {
      label: `${authority} connected`,
      value: connectedAuthority,
      hint: `${pct(connectedAuthority, companiesCount)}% coverage`,
      icon: ShieldCheck,
      tone: '',
    },
    {
      label: 'Posted invoices',
      value: posted,
      hint: `${k.successRate ?? 0}% success`,
      icon: CheckCircle2,
      tone: '',
    },
  ];

  const secondary = [
    { label: 'Customer users', value: k.users ?? 0, icon: Users },
    { label: 'Pending invoices', value: pending, icon: Clock3 },
    { label: 'Failed posts', value: failed, icon: AlertTriangle, danger: failed > 0 },
    { label: 'Success rate', value: `${k.successRate ?? 0}%`, icon: TrendingUp },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">{authority} operations</div>
          <h1>Dashboard</h1>
        </div>
        <Link className="btn btn-primary" to={isFbr ? newCompanyPath : companiesPath}>
          {isFbr ? '+ New FBR company' : 'Manage companies'}
        </Link>
      </div>

      <div className="dash-hero-grid">
        {hero.map((item) => (
          <div className="card dash-square" key={item.label}>
            <div className="dash-square-icon">
              <item.icon size={18} />
            </div>
            <div className="kpi-label">{item.label}</div>
            <div className="kpi-value">{item.value}</div>
            <div className="dash-hint">{item.hint}</div>
          </div>
        ))}
      </div>

      <div className="grid kpi dash-stat-row">
        {secondary.map((item) => (
          <div className={`card kpi-card dash-rect${item.danger ? ' danger-kpi' : ''}`} key={item.label}>
            <div className="kpi-icon">
              <item.icon size={15} />
            </div>
            <div className="kpi-label">{item.label}</div>
            <div className="kpi-value">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid two-eq dash-charts-row">
        <div className="card dash-panel">
          <h3>Invoice mix</h3>
          <div className="dash-donut-wrap">
            <div
              className="dash-donut"
              style={{ background: donutBackground(posted, pending, failed) }}
              aria-hidden="true"
            >
              <div className="dash-donut-hole">
                <strong>{invoiceTotal}</strong>
                <span>tracked</span>
              </div>
            </div>
            <div className="dash-legend">
              {bars.map((b) => (
                <div className="dash-legend-item" key={b.label}>
                  <span className="dash-dot" style={{ background: b.color }} />
                  <span>{b.label}</span>
                  <strong>{b.value}</strong>
                  <em>{pct(b.value, invoiceTotal)}%</em>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card dash-panel">
          <h3>Platform coverage</h3>
          <CoverageRow
            label="Active companies"
            value={Number(k.activeCompanies ?? 0)}
            total={companiesCount}
            color="var(--teal)"
          />
          <CoverageRow
            label="QuickBooks Online"
            value={connectedQbo}
            total={companiesCount}
            color="#2563eb"
          />
          <CoverageRow
            label={`${authority} fiscal connection`}
            value={connectedAuthority}
            total={companiesCount}
            color="var(--ok)"
          />
          <div className="dash-ring-note">
            Coverage is measured against total companies in this {authority} workspace.
          </div>
        </div>
      </div>

      <div className="grid two-eq">
        <div className="card dash-panel">
          <h3>Invoice traffic</h3>
          <div className="traffic-chart dash-bars">
            {bars.map((b) => (
              <div className="traffic-col" key={b.label}>
                <div className="dash-bar-value">{b.value}</div>
                <div className="traffic-track">
                  <div
                    className="traffic-fill"
                    style={{
                      height: `${Math.round((b.value / maxBar) * 100)}%`,
                      background: b.color,
                    }}
                  />
                </div>
                <div className="dash-bar-label">{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card dash-panel">
          <div className="status-card-title">
            <h3 style={{ margin: 0 }}>Companies</h3>
            <Link className="btn btn-ghost" to={companiesPath}>
              View all
            </Link>
          </div>
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>QBO</th>
                  <th>{authority}</th>
                </tr>
              </thead>
              <tbody>
                {companies.length ? (
                  companies.map((org) => (
                    <tr
                      key={org.id}
                      className="clickable-row"
                      onClick={() => navigate(`${companiesPath}/${org.id}`)}
                    >
                      <td>
                        <strong>{org.name}</strong>
                      </td>
                      <td>
                        <StatusBadge status={org.qbo?.status} />
                      </td>
                      <td>
                        <StatusBadge status={isFbr ? org.fbr?.status : org.pra?.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ color: 'var(--muted)', padding: 20 }}>
                      No companies yet. Create one to start connecting QuickBooks.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export function AdminOverviewPage() {
  return <AdminDashboardPage mode="PRA" />;
}

export function FbrAdminOverviewPage() {
  return <AdminDashboardPage mode="FBR" />;
}
