import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, AlertTriangle, Building2, CheckCircle2, Plug } from 'lucide-react';
import { api } from '../lib/api';
import { startQboOAuth } from '../lib/qbo-oauth';
import { useAuth } from '../auth';
import { PageLoader } from '../components/PageLoader';
import { QboConnectPrompt } from '../components/QboConnectPrompt';

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

export function FbrAdminOverviewPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api('/admin/overview'), api<any[]>('/admin/companies')])
      .then(([overview, orgs]) => {
        setData(overview);
        setCompanies(orgs.slice(0, 6));
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <PageLoader label="Loading FBR dashboard…" />;

  const k = data.kpis || {};
  const posted = Number(k.postedInvoices ?? 0);
  const pending = Number(k.pendingInvoices ?? 0);
  const failed = Number(k.failedInvoices ?? 0);
  const maxBar = Math.max(posted, pending, failed, 1);
  const primary = [
    { label: 'Companies', value: k.companies ?? 0, icon: Building2, tone: '' },
    { label: 'FBR connected', value: k.connectedFbr ?? 0, icon: Plug, tone: '' },
    { label: 'Posted invoices', value: posted, icon: CheckCircle2, tone: '' },
    { label: 'Failed posts', value: failed, icon: AlertTriangle, tone: failed ? 'danger-kpi' : '' },
  ];
  const secondary: [string, string | number][] = [
    ['Active companies', k.activeCompanies ?? k.companies ?? 0],
    ['QBO connected', k.connectedQbo ?? 0],
    ['Pending invoices', pending],
    ['Success rate', `${k.successRate ?? 0}%`],
  ];
  const bars = [
    { label: 'Posted', value: posted, color: 'var(--ok)' },
    { label: 'Pending', value: pending, color: 'var(--warn)' },
    { label: 'Failed', value: failed, color: 'var(--danger)' },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">FBR control plane</div>
          <h1>Dashboard</h1>
          <p>Federal Board of Revenue — DI validate/post overview, isolated from PRA.</p>
        </div>
        <Link className="btn btn-primary" to="/admin/fbr/companies/new">
          + New FBR company
        </Link>
      </div>

      <div className="grid kpi" style={{ marginBottom: 16 }}>
        {primary.map((item) => (
          <div className={`card kpi-card ${item.tone || ''}`} key={item.label}>
            <div className="kpi-icon">
              <item.icon size={15} />
            </div>
            <div className="kpi-label">{item.label}</div>
            <div className="kpi-value">{item.value}</div>
          </div>
        ))}
      </div>
      <div className="grid kpi" style={{ marginBottom: 16 }}>
        {secondary.map(([label, value]) => (
          <div className="card kpi-card" key={label}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid two-eq" style={{ marginBottom: 16 }}>
        <div className="card">
          <h3>Invoice traffic</h3>
          <div className="traffic-chart">
            {bars.map((b) => (
              <div className="traffic-col" key={b.label}>
                <div className="traffic-track">
                  <div
                    className="traffic-fill"
                    style={{
                      height: `${Math.round((b.value / maxBar) * 100)}%`,
                      background: b.color,
                    }}
                  />
                </div>
                <div style={{ marginTop: 8, color: 'var(--muted)', fontSize: 13 }}>
                  {b.label}: <strong style={{ color: 'var(--ink-soft)' }}>{b.value}</strong>
                </div>
              </div>
            ))}
          </div>
          <p className="map-hint" style={{ marginTop: 12 }}>
            FBR invoice numbers only — never mixed with PRA fiscal numbers.
          </p>
        </div>
        <div className="card">
          <div className="status-card-title">
            <h3 style={{ margin: 0 }}>Companies</h3>
            <Link className="btn btn-ghost" to="/admin/fbr/companies">
              View all
            </Link>
          </div>
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>NTN</th>
                  <th>FBR</th>
                </tr>
              </thead>
              <tbody>
                {companies.length ? (
                  companies.map((org) => (
                    <tr
                      key={org.id}
                      className="clickable-row"
                      onClick={() => navigate(`/admin/fbr/companies/${org.id}`)}
                    >
                      <td>
                        <strong>{org.name}</strong>
                      </td>
                      <td>{org.fbr?.sellerNTNCNIC || '—'}</td>
                      <td>
                        <StatusBadge status={org.fbr?.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ color: 'var(--muted)', padding: 20 }}>
                      No FBR companies yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="status-card-title">
          <h3 style={{ margin: 0 }}>
            <Activity size={16} style={{ marginRight: 8, verticalAlign: -2 }} />
            Recent FBR activity
          </h3>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Organization</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLogs?.length ? (
                data.recentLogs.map((log: any) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.action}</td>
                    <td>{log.user?.fullName || '—'}</td>
                    <td>{log.organization?.name || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--muted)', padding: 20 }}>
                    No FBR activity yet. Create a company and post a DI invoice to see events here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export function FbrCustomerDashboardPage() {
  const [data, setData] = useState<any>(null);
  const { refresh } = useAuth();

  useEffect(() => {
    api('/fbr/customer/dashboard')
      .then((res) => {
        setData(res);
        refresh().catch(() => null);
      })
      .catch(() => setData(null));
  }, [refresh]);

  if (!data) return <PageLoader label="Loading FBR workspace…" />;
  const pct = Math.round((data.onboarding.completed / data.onboarding.total) * 100);
  const qboConnected = data.org?.qbo?.status === 'CONNECTED';

  if (!qboConnected) {
    return (
      <>
        <div className="topbar">
          <div>
            <div className="crumb">FBR workspace</div>
            <h1>{data.org?.name || 'FBR workspace'}</h1>
            <p>Connect QuickBooks Online to fetch invoices and post to FBR DI.</p>
          </div>
        </div>
        <QboConnectPrompt
          companyName={data.org?.name}
          returnPath="/fbr/app/connections"
          authUrlPath="/fbr/customer/qbo/auth-url"
        />
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">FBR workspace</div>
          <h1>{data.org?.name}</h1>
          <p>QuickBooks → FBR DI validate/post. FBR invoice numbers stay isolated from PRA.</p>
        </div>
        <Link className="btn btn-primary" to="/fbr/app/connections">
          Manage connections
        </Link>
      </div>
      <div className="grid kpi" style={{ marginBottom: 16 }}>
        {[
          ['Posted', data.kpis.posted],
          ['Pending', data.kpis.pending],
          ['Failed', data.kpis.failed],
          ['Total tracked', data.kpis.total],
        ].map(([label, value]) => (
          <div className="card kpi-card" key={label as string}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
          </div>
        ))}
      </div>
      <div className="grid two">
        <div className="card">
          <h3>Onboarding runway</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: 'var(--muted)' }}>
              {data.onboarding.completed}/{data.onboarding.total} complete
            </span>
            <strong>{pct}%</strong>
          </div>
          <div className="progress" style={{ marginBottom: 14 }}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <div className="step-list">
            {data.onboarding.steps.map((s: any) => (
              <div className="step-item" key={s.key}>
                <span>{s.label}</span>
                <StatusBadge status={s.done ? 'CONNECTED' : 'PENDING'} />
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3>Connection health</h3>
          <div className="step-list">
            <div className="step-item">
              <span>QuickBooks Online</span>
              <StatusBadge status={data.org?.qbo?.status} />
            </div>
            <div className="step-item">
              <span>FBR DI</span>
              <StatusBadge status={data.org?.fbr?.status} />
            </div>
            <div className="step-item">
              <span>Seller NTN</span>
              <strong>{data.org?.fbr?.sellerNTNCNIC || '—'}</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Recent FBR invoices</h3>
        <table className="table">
          <thead>
            <tr>
              <th>USIN</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>FBR invoice no.</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.recentInvoices?.map((inv: any) => (
              <tr key={inv.id}>
                <td>{inv.usin || inv.qboInvoiceId}</td>
                <td>{inv.customerName || '—'}</td>
                <td>{inv.totalAmount ?? '—'}</td>
                <td>{inv.fbrInvoiceNo || '—'}</td>
                <td>
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
            {!data.recentInvoices?.length && (
              <tr>
                <td colSpan={5} style={{ color: 'var(--muted)' }}>
                  No FBR invoices yet. Connect QBO, map fields, then validate/post.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function FbrCustomerConnectionsPage() {
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const { refresh } = useAuth();

  async function load() {
    const res = await api('/fbr/customer/connections');
    setData(res);
    if (res?.qbo?.status === 'CONNECTED') {
      try {
        const [c, inv] = await Promise.all([
          api('/fbr/customer/qbo/company'),
          api('/fbr/customer/qbo/invoices'),
        ]);
        setCompany(c);
        setInvoices(inv.invoices || []);
      } catch (e: any) {
        setErr(e.message);
      }
      refresh().catch(() => null);
    } else {
      setCompany(null);
      setInvoices([]);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('qbo') === 'connected') {
      setMsg('QuickBooks connected successfully.');
      window.history.replaceState({}, '', '/fbr/app/connections');
    }
    if (params.get('qbo') === 'error') {
      setErr(params.get('message') || 'QuickBooks connection failed');
      window.history.replaceState({}, '', '/fbr/app/connections');
    }
    load().catch((e) => setErr(e.message));
  }, []);

  if (!data) return <PageLoader label="Loading connections…" />;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">FBR workspace</div>
          <h1>Connections</h1>
          <p>Connect QuickBooks. FBR seller identity and token are managed by Super Admin.</p>
        </div>
      </div>
      {msg && (
        <div className="card" style={{ marginBottom: 16, color: 'var(--ok)' }}>
          {msg}
        </div>
      )}
      {err && <div className="error-box">{err}</div>}
      <div className="grid two">
        <div className="card">
          <h3>QuickBooks Online</h3>
          <p style={{ color: 'var(--muted)' }}>
            Status: <StatusBadge status={data.qbo?.status} />
          </p>
          {data.qbo?.companyName && (
            <p style={{ marginTop: 0 }}>
              Company: <strong>{data.qbo.companyName}</strong>
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setErr('');
                try {
                  await startQboOAuth('/fbr/customer/qbo/auth-url', '/fbr/app/connections');
                } catch (e: any) {
                  setErr(e.message);
                  setBusy(false);
                }
              }}
            >
              {data.qbo?.status === 'CONNECTED' ? 'Reconnect QuickBooks' : 'Connect QuickBooks (Live)'}
            </button>
            {data.qbo?.status === 'CONNECTED' && (
              <button
                className="btn btn-ghost"
                onClick={async () => {
                  setErr('');
                  try {
                    await load();
                    setMsg('Synced latest company + invoices from QBO');
                  } catch (e: any) {
                    setErr(e.message);
                  }
                }}
              >
                Refresh data
              </button>
            )}
          </div>
        </div>
        <div className="card">
          <h3>FBR / PRAL DI</h3>
          <p style={{ color: 'var(--muted)' }}>
            Status: <StatusBadge status={data.fbr?.status} />
          </p>
          <div className="step-list">
            <div className="step-item">
              <span>Seller NTN/CNIC</span>
              <strong>{data.fbr?.sellerNTNCNIC || '—'}</strong>
            </div>
            <div className="step-item">
              <span>Seller name</span>
              <strong>{data.fbr?.sellerBusinessName || '—'}</strong>
            </div>
            <div className="step-item">
              <span>Environment</span>
              <strong>{(data.fbr?.environment || 'sandbox').toUpperCase()}</strong>
            </div>
            <div className="step-item">
              <span>Token</span>
              <strong>{data.fbr?.hasToken ? 'Configured by admin' : 'Not configured'}</strong>
            </div>
          </div>
          <p className="map-hint" style={{ marginTop: 12 }}>
            Super Admin sets Sandbox/Production, API URL, seller NTN, and bearer token. Validate
            then post returns an FBR invoice number — never a PRA fiscal number.
          </p>
        </div>
      </div>

      {data.qbo?.status === 'CONNECTED' && company?.company && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Live company profile (read-only)</h3>
          <div className="step-list">
            <div className="step-item">
              <span>Company name</span>
              <strong>{company.company.CompanyName}</strong>
            </div>
            <div className="step-item">
              <span>Realm ID</span>
              <strong>{company.realmId}</strong>
            </div>
          </div>
        </div>
      )}

      {data.qbo?.status === 'CONNECTED' && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Live QuickBooks invoices (read-only)</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Doc #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.Id}>
                  <td>{inv.DocNumber}</td>
                  <td>{inv.TxnDate}</td>
                  <td>{inv.CustomerRef?.name || '—'}</td>
                  <td>{inv.TotalAmt}</td>
                </tr>
              ))}
              {!invoices.length && (
                <tr>
                  <td colSpan={4} style={{ color: 'var(--muted)' }}>
                    No invoices returned from QuickBooks yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function FbrCustomerInvoicesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [scenario, setScenario] = useState<'SN001' | 'SN002'>('SN001');
  const [connected, setConnected] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    setErr('');
    try {
      const conn = await api('/fbr/customer/connections');
      const isConnected = conn?.qbo?.status === 'CONNECTED';
      setConnected(isConnected);
      if (!isConnected) {
        setRows([]);
        return;
      }
      const data = await api<any[]>('/fbr/customer/invoices');
      setRows(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function invoiceCustom(inv: any, name: string) {
    const match = (inv?.customField || []).find(
      (field: any) => String(field?.Name || '').toLowerCase() === name.toLowerCase(),
    );
    const value =
      match?.StringValue ?? match?.NumberValue ?? match?.DateValue ?? match?.BooleanValue;
    if (value == null || value === '') return '—';
    return String(value);
  }

  async function validateOne(qboInvoiceId: string) {
    setBusy(qboInvoiceId);
    setMsg('');
    setErr('');
    try {
      await api(`/fbr/customer/invoices/${qboInvoiceId}/validate`, {
        method: 'POST',
        body: JSON.stringify({ scenarioId: scenario }),
      });
      setMsg(`Validated ${qboInvoiceId}`);
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function postOne(qboInvoiceId: string) {
    setBusy(qboInvoiceId);
    setMsg('');
    setErr('');
    try {
      const res = await api<{ fbrInvoiceNo: string }>(
        `/fbr/customer/invoices/${qboInvoiceId}/post`,
        {
          method: 'POST',
          body: JSON.stringify({ scenarioId: scenario, writeToQbo: true }),
        },
      );
      setMsg(`Posted — FBR invoice no: ${res.fbrInvoiceNo}`);
      await load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(null);
    }
  }

  if (!loaded) return <PageLoader label="Syncing QuickBooks invoices…" />;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">FBR workspace</div>
          <h1>Invoices</h1>
          <p>Validate then post to FBR DI — stores FBR invoice number, not PRA fiscal number.</p>
        </div>
        <select
          value={scenario}
          onChange={(e) => setScenario(e.target.value as 'SN001' | 'SN002')}
          className="btn btn-ghost"
        >
          <option value="SN001">SN001 — Registered buyer</option>
          <option value="SN002">SN002 — Unregistered buyer</option>
        </select>
      </div>
      {msg && (
        <div className="card flash-ok">{msg}</div>
      )}
      {err && <div className="error-box">{err}</div>}
      {!connected ? (
        <QboConnectPrompt
          returnPath="/fbr/app/connections"
          authUrlPath="/fbr/customer/qbo/auth-url"
        />
      ) : (
        <div className="di-invoice-panel">
          <table className="di-invoice-table">
            <thead>
              <tr>
                <th>Doc #</th>
                <th>Date</th>
                <th>Customer</th>
                <th className="num">Total</th>
                <th>HS Code</th>
                <th>FBR invoice no.</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.qboInvoiceId}>
                  <td className="mono">{r.docNumber || r.qboInvoiceId}</td>
                  <td>{r.txnDate || '—'}</td>
                  <td>{r.customerName || '—'}</td>
                  <td className="num">{r.total ?? '—'}</td>
                  <td>{invoiceCustom(r, 'HS Code')}</td>
                  <td>{r.fbrInvoiceNo || '—'}</td>
                  <td>
                    <StatusBadge status={r.tracked?.status || 'PENDING'} />
                  </td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-ghost"
                      disabled={busy === r.qboInvoiceId}
                      onClick={() => validateOne(r.qboInvoiceId)}
                    >
                      Validate
                    </button>
                    <button
                      className="btn btn-primary"
                      disabled={busy === r.qboInvoiceId}
                      onClick={() => postOne(r.qboInvoiceId)}
                    >
                      Post
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={8} className="empty-cell">
                    No invoices returned from QuickBooks.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
