import { Link } from 'react-router-dom';
import { Activity, Building2, Plug, ShieldCheck } from 'lucide-react';
import type { IntegrationMode } from '../lib/api';

function StatusBadge({ status }: { status?: string }) {
  const s = (status || 'DISCONNECTED').toUpperCase();
  const cls =
    s === 'CONNECTED' || s === 'POSTED' || s === 'VALIDATED'
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

export function CustomerKpiRow({ kpis }: { kpis: Record<string, number> }) {
  return (
    <div className="grid kpi customer-kpi-row">
      {[
        ['Posted', kpis.posted ?? 0],
        ['Pending', kpis.pending ?? 0],
        ['Failed', kpis.failed ?? 0],
        ['Total tracked', kpis.total ?? 0],
      ].map(([label, value]) => (
        <div className="card kpi-card customer-kpi-tile" key={label as string}>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value">{value}</div>
        </div>
      ))}
    </div>
  );
}

export function InvoiceOverviewPanel({ kpis }: { kpis: Record<string, number> }) {
  const posted = Number(kpis.posted || 0);
  const pending = Number(kpis.pending || 0);
  const failed = Number(kpis.failed || 0);
  const total = posted + pending + failed;
  const maxBar = Math.max(posted, pending, failed, 1);
  const successRate = posted + failed === 0 ? 100 : Math.round((posted / (posted + failed)) * 100);
  const bars = [
    { label: 'Posted', value: posted, color: 'var(--ok)' },
    { label: 'Pending', value: pending, color: 'var(--warn)' },
    { label: 'Failed', value: failed, color: 'var(--danger)' },
  ];

  return (
    <div className="card dash-panel customer-invoice-panel">
      <div className="customer-panel-head">
        <h3>Invoice overview</h3>
        <span className="customer-panel-meta">{successRate}% success</span>
      </div>
      <div className="customer-invoice-grid">
        <div className="dash-donut-wrap customer-donut-wrap">
          <div
            className="dash-donut customer-donut"
            style={{ background: donutBackground(posted, pending, failed) }}
            aria-hidden="true"
          >
            <div className="dash-donut-hole">
              <strong>{total}</strong>
              <span>invoices</span>
            </div>
          </div>
          <div className="dash-legend customer-legend">
            {bars.map((b) => (
              <div className="dash-legend-item" key={b.label}>
                <span className="dash-dot" style={{ background: b.color }} />
                <span>{b.label}</span>
                <strong>{b.value}</strong>
                <em>{pct(b.value, total)}%</em>
              </div>
            ))}
          </div>
        </div>
        <div className="traffic-chart dash-bars customer-bars">
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
    </div>
  );
}

type ConnectionsMiniProps = {
  mode: IntegrationMode;
  org: any;
  onboarding: { completed: number; total: number; steps: Array<{ key: string; label: string; done: boolean }> };
  connectionsPath: string;
};

export function ConnectionsMiniPanel({ mode, org, onboarding, connectionsPath }: ConnectionsMiniProps) {
  const pctDone = Math.round((onboarding.completed / onboarding.total) * 100);
  const pendingSteps = onboarding.steps.filter((s) => !s.done);

  return (
    <aside className="connections-mini">
      <div className="card connections-mini-card">
        <div className="connections-mini-head">
          <div>
            <Activity size={16} />
            <h3>Connections</h3>
          </div>
          <Link className="btn btn-ghost btn-mini" to={connectionsPath}>
            Manage
          </Link>
        </div>

        <div className="connections-mini-block">
          <div className="connections-mini-service">
            <div className="connections-mini-icon">
              <Plug size={14} />
            </div>
            <div className="connections-mini-copy">
              <span>QuickBooks Online</span>
              {org?.qbo?.companyName && (
                <em>{org.qbo.companyName}</em>
              )}
            </div>
            <StatusBadge status={org?.qbo?.status} />
          </div>

          <div className="connections-mini-service">
            <div className="connections-mini-icon">
              <ShieldCheck size={14} />
            </div>
            <div className="connections-mini-copy">
              <span>{mode === 'FBR' ? 'FBR DI' : 'PRA e-IMS'}</span>
              {mode === 'PRA' && org?.pra?.posId && <em>POS {org.pra.posId}</em>}
              {mode === 'FBR' && org?.fbr?.sellerNTNCNIC && (
                <em>NTN {org.fbr.sellerNTNCNIC}</em>
              )}
            </div>
            <StatusBadge status={mode === 'FBR' ? org?.fbr?.status : org?.pra?.status} />
          </div>
        </div>

        <div className="connections-mini-facts">
          {mode === 'PRA' ? (
            <>
              <div>
                <span>POS ID</span>
                <strong className="mono">{org?.pra?.posId || '—'}</strong>
              </div>
              <div>
                <span>Environment</span>
                <strong>{(org?.pra?.environment || 'sandbox').toUpperCase()}</strong>
              </div>
              <div>
                <span>Branches</span>
                <strong>{org?.branches?.length || 0}</strong>
              </div>
              <div>
                <span>Mappings</span>
                <strong>{org?._count?.mappings ?? 0}</strong>
              </div>
            </>
          ) : (
            <>
              <div>
                <span>Environment</span>
                <strong>{(org?.fbr?.environment || 'sandbox').toUpperCase()}</strong>
              </div>
              <div>
                <span>Seller name</span>
                <strong>{org?.fbr?.sellerBusinessName || '—'}</strong>
              </div>
              <div>
                <span>Province</span>
                <strong>{org?.fbr?.sellerProvince || '—'}</strong>
              </div>
              <div>
                <span>NTN/CNIC</span>
                <strong className="mono">{org?.fbr?.sellerNTNCNIC || '—'}</strong>
              </div>
            </>
          )}
        </div>

        <div className="connections-mini-setup">
          <div className="connections-mini-setup-head">
            <span>Setup progress</span>
            <strong>
              {onboarding.completed}/{onboarding.total} · {pctDone}%
            </strong>
          </div>
          <div className="progress connections-mini-progress">
            <span style={{ width: `${pctDone}%` }} />
          </div>
          {pendingSteps.length ? (
            <ul className="connections-mini-pending">
              {pendingSteps.slice(0, 3).map((step) => (
                <li key={step.key}>{step.label}</li>
              ))}
              {pendingSteps.length > 3 && <li>+{pendingSteps.length - 3} more</li>}
            </ul>
          ) : (
            <p className="connections-mini-done">All setup steps complete.</p>
          )}
        </div>
      </div>

      <div className="card connections-mini-card connections-mini-org">
        <div className="connections-mini-icon connections-mini-icon-wide">
          <Building2 size={14} />
        </div>
        <div>
          <span className="connections-mini-org-label">Organization</span>
          <strong>{org?.name || '—'}</strong>
          {org?.pntn && <em>PNTN {org.pntn}</em>}
        </div>
      </div>
    </aside>
  );
}

export function RecentInvoicesPanel({
  invoices,
  mode,
  invoicesPath,
  emptyHint,
}: {
  invoices: any[];
  mode: IntegrationMode;
  invoicesPath: string;
  emptyHint: string;
}) {
  const isFbr = mode === 'FBR';

  return (
    <div className="card customer-recent-panel">
      <div className="customer-panel-head">
        <h3>Recent invoices</h3>
        <Link className="btn btn-ghost btn-mini" to={invoicesPath}>
          View all
        </Link>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>USIN</th>
              <th>Customer</th>
              <th>Amount</th>
              {isFbr && <th>FBR no.</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices?.length ? (
              invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.usin || inv.qboInvoiceId}</td>
                  <td>{inv.customerName || '—'}</td>
                  <td>{inv.totalAmount ?? '—'}</td>
                  {isFbr && <td>{inv.fbrInvoiceNo || '—'}</td>}
                  <td>
                    <StatusBadge status={inv.status} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isFbr ? 5 : 4} style={{ color: 'var(--muted)', padding: 20 }}>
                  {emptyHint}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CustomerDashboardShell({
  title,
  crumb,
  connectionsPath,
  mode,
  data,
  emptyHint,
}: {
  title: string;
  crumb?: string;
  connectionsPath: string;
  mode: IntegrationMode;
  data: any;
  emptyHint: string;
}) {
  const invoicesPath = mode === 'FBR' ? '/fbr/app/invoices' : '/app/invoices';

  return (
    <>
      <div className="topbar">
        <div>
          {crumb && <div className="crumb">{crumb}</div>}
          <h1>{title}</h1>
        </div>
      </div>

      <div className="customer-dash-layout">
        <div className="customer-dash-main">
          <CustomerKpiRow kpis={data.kpis} />
          <InvoiceOverviewPanel kpis={data.kpis} />
          <RecentInvoicesPanel
            invoices={data.recentInvoices}
            mode={mode}
            invoicesPath={invoicesPath}
            emptyHint={emptyHint}
          />
        </div>

        <ConnectionsMiniPanel
          mode={mode}
          org={data.org}
          onboarding={data.onboarding}
          connectionsPath={connectionsPath}
        />
      </div>
    </>
  );
}
