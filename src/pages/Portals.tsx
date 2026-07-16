import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

function StatusBadge({ status }: { status?: string }) {
  const s = (status || 'DISCONNECTED').toUpperCase();
  const cls =
    s === 'CONNECTED' ? 'ok' : s === 'ERROR' || s === 'FAILED' ? 'danger' : 'muted';
  return <span className={`badge ${cls}`}>{s}</span>;
}

export function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/overview')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <p>Loading command center…</p>;

  const k = data.kpis;
  return (
    <>
      <div className="topbar">
        <div>
          <h1>Command Center</h1>
          <p>Live pulse across every tenant on PRA Connector.</p>
        </div>
      </div>
      <div className="grid kpi" style={{ marginBottom: 16 }}>
        {[
          ['Organizations', k.organizations],
          ['Customer users', k.users],
          ['QBO connected', k.connectedQbo],
          ['PRA connected', k.connectedPra],
          ['Posted invoices', k.postedInvoices],
          ['Failed posts', k.failedInvoices],
          ['Success rate', `${k.successRate}%`],
          ['Audit events', data.recentLogs?.length || 0],
        ].map(([label, value]) => (
          <div className="card kpi-card" key={label as string}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h3>Recent platform activity</h3>
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
            {data.recentLogs?.map((log: any) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.action}</td>
                <td>{log.user?.fullName || '—'}</td>
                <td>{log.organization?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminOrganizationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    posId: '',
    apiUrl: '',
    apiToken: '',
    environment: 'sandbox',
  });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  async function load(query = q) {
    const data = await api(`/admin/organizations${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    setRows(data);
  }

  useEffect(() => {
    load();
  }, []);

  function openPraConfig(org: any) {
    setSelectedId(org.id);
    setMsg('');
    setErr('');
    setForm({
      posId: org.pra?.posId || '',
      apiUrl:
        org.pra?.apiUrl ||
        (org.pra?.environment === 'production'
          ? 'https://ims.pral.com.pk/ims/production/api/Live/PostData'
          : 'https://ims.pral.com.pk/ims/sandbox/api/Live/PostData'),
      apiToken: org.pra?.apiToken || '',
      environment: org.pra?.environment || 'sandbox',
    });
  }

  const selected = rows.find((r) => r.id === selectedId);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Organizations</h1>
          <p>Configure each company’s PRA POS ID, API URL, and token.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / PNTN"
            style={{ borderRadius: 12, border: '1px solid var(--line)', padding: '10px 12px' }}
          />
          <button className="btn btn-primary" onClick={() => load()}>
            Search
          </button>
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
          <table className="table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>QBO</th>
                <th>PRA</th>
                <th>POS ID</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((org) => (
                <tr
                  key={org.id}
                  style={{
                    background: selectedId === org.id ? 'rgba(15,118,110,0.08)' : undefined,
                  }}
                >
                  <td>
                    <strong>{org.name}</strong>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{org.pntn || 'No PNTN'}</div>
                  </td>
                  <td>
                    <StatusBadge status={org.qbo?.status} />
                  </td>
                  <td>
                    <StatusBadge status={org.pra?.status} />
                  </td>
                  <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
                    {org.pra?.posId || '—'}
                  </td>
                  <td>
                    <button className="btn btn-primary" onClick={() => openPraConfig(org)}>
                      Configure PRA
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--muted)' }}>
                    No organizations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>PRA credentials</h3>
          {!selected ? (
            <p style={{ color: 'var(--muted)' }}>
              Select a company and click <strong>Configure PRA</strong> to set POS ID, API URL, and
              token. Customers cannot edit these — values are applied automatically for that org.
            </p>
          ) : (
            <>
              <p style={{ marginTop: 0 }}>
                Configuring: <strong>{selected.name}</strong>
              </p>
              <div className="field">
                <label>Environment</label>
                <select
                  value={form.environment}
                  onChange={(e) => {
                    const environment = e.target.value;
                    setForm({
                      ...form,
                      environment,
                      apiUrl:
                        environment === 'production'
                          ? 'https://ims.pral.com.pk/ims/production/api/Live/PostData'
                          : 'https://ims.pral.com.pk/ims/sandbox/api/Live/PostData',
                    });
                  }}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    padding: '12px 14px',
                    background: '#f8fafc',
                  }}
                >
                  <option value="sandbox">Sandbox</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <div className="field">
                <label>POS ID</label>
                <input
                  value={form.posId}
                  onChange={(e) => setForm({ ...form, posId: e.target.value })}
                  placeholder="PRA POS ID for this company"
                />
              </div>
              <div className="field">
                <label>PRA API URL</label>
                <input
                  value={form.apiUrl}
                  onChange={(e) => setForm({ ...form, apiUrl: e.target.value })}
                  placeholder="https://ims.pral.com.pk/..."
                />
              </div>
              <div className="field">
                <label>PRA API Token</label>
                <input
                  value={form.apiToken}
                  onChange={(e) => setForm({ ...form, apiToken: e.target.value })}
                  placeholder="Bearer token for this company"
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    setErr('');
                    setMsg('');
                    try {
                      await api(`/admin/organizations/${selectedId}/pra`, {
                        method: 'PATCH',
                        body: JSON.stringify(form),
                      });
                      setMsg(`PRA config saved for ${selected.name}`);
                      await load();
                    } catch (e: any) {
                      setErr(e.message);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  {saving ? 'Saving…' : 'Save PRA config'}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setSelectedId(null);
                    setMsg('');
                    setErr('');
                  }}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function AdminUsersPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api('/admin/users').then(setRows);
  }, []);
  return (
    <>
      <div className="topbar">
        <div>
          <h1>Users</h1>
          <p>Customer admins and workspace members.</p>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Organization</th>
              <th>Last login</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.organization?.name || '—'}</td>
                <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminInvoicesPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api('/admin/invoices').then(setRows);
  }, []);
  return (
    <>
      <div className="topbar">
        <div>
          <h1>Invoice Traffic</h1>
          <p>Cross-tenant fiscalization pipeline.</p>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Org</th>
              <th>USIN</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Fiscal #</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.organization?.name}</td>
                <td>{r.usin || r.qboInvoiceId}</td>
                <td>{r.customerName || '—'}</td>
                <td>{r.totalAmount ?? '—'}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td>{r.fiscalInvoiceNo || '—'}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} style={{ color: 'var(--muted)' }}>
                  No invoice traffic yet — customers will populate this as they sync.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function AdminLogsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api('/admin/logs').then(setRows);
  }, []);
  return (
    <>
      <div className="topbar">
        <div>
          <h1>Audit Stream</h1>
          <p>Immutable trail of platform actions.</p>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>User</th>
              <th>Organization</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.action}</td>
                <td>{log.user?.email || '—'}</td>
                <td>{log.organization?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function CustomerDashboardPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    api('/customer/dashboard').then(setData);
  }, []);
  if (!data) return <p>Loading workspace…</p>;
  const pct = Math.round((data.onboarding.completed / data.onboarding.total) * 100);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>{data.org?.name}</h1>
          <p>Set it up once — then the connector keeps fiscal posts flowing.</p>
        </div>
        <Link className="btn btn-primary" to="/app/connections">
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
              <span>PRA e-IMS</span>
              <StatusBadge status={data.org?.pra?.status} />
            </div>
            <div className="step-item">
              <span>Branches configured</span>
              <strong>{data.org?.branches?.length || 0}</strong>
            </div>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Recent invoices</h3>
        <table className="table">
          <thead>
            <tr>
              <th>USIN</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.recentInvoices?.map((inv: any) => (
              <tr key={inv.id}>
                <td>{inv.usin || inv.qboInvoiceId}</td>
                <td>{inv.customerName || '—'}</td>
                <td>{inv.totalAmount ?? '—'}</td>
                <td>
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
            {!data.recentInvoices?.length && (
              <tr>
                <td colSpan={4} style={{ color: 'var(--muted)' }}>
                  No invoices yet. Seed a demo from the Invoices page or connect QBO.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function CustomerConnectionsPage() {
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await api('/customer/connections');
    setData(res);
    if (res?.qbo?.status === 'CONNECTED') {
      try {
        const [c, inv] = await Promise.all([
          api('/customer/qbo/company'),
          api('/customer/qbo/invoices'),
        ]);
        setCompany(c);
        setInvoices(inv.invoices || []);
      } catch (e: any) {
        setErr(e.message);
      }
    } else {
      setCompany(null);
      setInvoices([]);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('qbo') === 'connected') {
      setMsg('QuickBooks connected successfully.');
      window.history.replaceState({}, '', '/app/connections');
    }
    if (params.get('qbo') === 'error') {
      setErr(params.get('message') || 'QuickBooks connection failed');
      window.history.replaceState({}, '', '/app/connections');
    }
    load().catch((e) => setErr(e.message));
  }, []);

  if (!data) return <p>Loading connections…</p>;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Connections</h1>
          <p>Connect QuickBooks. PRA credentials are managed by Super Admin for your company.</p>
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
          {data.qboEnvironment && (
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 0 }}>
              QBO environment: <strong>{data.qboEnvironment}</strong>
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
                  const { url } = await api<{ url: string }>('/customer/qbo/auth-url');
                  window.location.href = url;
                } catch (e: any) {
                  setErr(e.message);
                  setBusy(false);
                }
              }}
            >
              {data.qbo?.status === 'CONNECTED'
                ? 'Reconnect QuickBooks'
                : 'Connect QuickBooks (Live)'}
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
          <p className="map-hint" style={{ marginTop: 12 }}>
            Intuit Redirect URI must include:{' '}
            <code>http://localhost:4000/api/qbo/callback</code>
          </p>
        </div>
        <div className="card">
          <h3>PRA e-IMS</h3>
          <p style={{ color: 'var(--muted)' }}>
            Status: <StatusBadge status={data.pra?.status} />
          </p>
          <div className="step-list">
            <div className="step-item">
              <span>POS ID</span>
              <strong style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13 }}>
                {data.pra?.posId || 'Not configured'}
              </strong>
            </div>
            <div className="step-item">
              <span>Environment</span>
              <strong>{data.pra?.environment || 'sandbox'}</strong>
            </div>
            <div className="step-item">
              <span>API URL</span>
              <strong style={{ fontSize: 12, textAlign: 'right', maxWidth: '60%' }}>
                {data.pra?.apiUrl || '—'}
              </strong>
            </div>
            <div className="step-item">
              <span>Token</span>
              <strong>{data.pra?.hasToken ? 'Configured by admin' : 'Not configured'}</strong>
            </div>
          </div>
          <p className="map-hint" style={{ marginTop: 12 }}>
            Super Admin sets POS ID, PRA API URL, and token for your company. Those values are used
            automatically when posting invoices.
          </p>
        </div>
      </div>

      {data.qbo?.status === 'CONNECTED' && <CompanyInfoPanel company={company} />}

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
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.Id}>
                  <td>{inv.DocNumber}</td>
                  <td>{inv.TxnDate}</td>
                  <td>{inv.CustomerRef?.name || '—'}</td>
                  <td>{inv.TotalAmt}</td>
                  <td>{inv.Balance}</td>
                </tr>
              ))}
              {!invoices.length && (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--muted)' }}>
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

function formatValue(v: any) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function formatQboAddress(addr: any) {
  if (!addr) return null;
  return [addr.Line1, addr.Line2, addr.City, addr.CountrySubDivisionCode, addr.PostalCode, addr.Country]
    .filter(Boolean)
    .join(', ');
}

function CompanyInfoPanel({ company }: { company: any }) {
  const info = company?.company;
  if (!info) return null;

  const rows = [
    ['Company name', info.CompanyName],
    ['Legal name', info.LegalName],
    ['Realm ID', company.realmId],
    ['Country', info.Country],
    ['Address', formatQboAddress(info.CompanyAddr)],
    ['Email', info.Email?.Address],
    ['Phone', info.PrimaryPhone?.FreeFormNumber],
    ['Company start', info.CompanyStartDate],
    ['Fiscal year start', info.FiscalYearStartMonth],
  ].filter(([, value]) => value);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3>Live company profile (read-only)</h3>
      <p className="map-hint" style={{ marginTop: 0 }}>
        Fetched from QuickBooks Online — no changes are made in your QBO company.
      </p>
      <div className="step-list">
        {rows.map(([label, value]) => (
          <div className="step-item" key={label}>
            <span>{label}</span>
            <strong style={{ textAlign: 'right', maxWidth: '65%' }}>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function MappingSectionTable({
  title,
  hint,
  section,
  rows,
  availableKeys,
  onSwap,
  onMove,
  onChangeSource,
}: {
  title: string;
  hint: string;
  section: 'HEADER' | 'LINE';
  rows: any[];
  availableKeys: string[];
  onSwap: (fromId: string, toId: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onChangeSource: (id: string, sourceField: string) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  return (
    <div className="card map-section">
      <div className="map-section-title">
        <h3>{title}</h3>
        <span className="map-hint">{hint}</span>
      </div>
      <table className="table map-table">
        <thead>
          <tr>
            <th style={{ width: 56 }}>#</th>
            <th>PRA key</th>
            <th>QBO key (drag to swap)</th>
            <th>Sample value</th>
            <th>Required</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const value = formatValue(row.value);
            return (
              <tr key={row.id}>
                <td>{idx + 1}</td>
                <td>
                  <div className="pra-key">{row.praKey}</div>
                </td>
                <td>
                  <div
                    className={`qbo-cell${dragId === row.id ? ' dragging' : ''}${
                      overId === row.id ? ' drag-over' : ''
                    }`}
                    draggable
                    onDragStart={() => setDragId(row.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setOverId(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOverId(row.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragId && dragId !== row.id) {
                        onSwap(dragId, row.id);
                      }
                      setDragId(null);
                      setOverId(null);
                    }}
                    title="Drag onto another QBO key to swap mapping"
                  >
                    <select
                      value={row.qboKey ?? ''}
                      onChange={(e) => onChangeSource(row.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex: 1,
                        border: 0,
                        background: 'transparent',
                        fontFamily: 'ui-monospace, monospace',
                        fontSize: 12,
                      }}
                    >
                      {availableKeys.map((k) => (
                        <option key={`${row.id}-${k || 'empty'}`} value={k}>
                          {k || '(empty / blank)'}
                        </option>
                      ))}
                      {row.qboKey && !availableKeys.includes(row.qboKey) && (
                        <option value={row.qboKey}>{row.qboKey}</option>
                      )}
                    </select>
                    <span style={{ opacity: 0.45 }}>⠿</span>
                  </div>
                </td>
                <td className={`value-cell${value ? '' : ' value-empty'}`}>
                  {value ?? '— not found / empty'}
                </td>
                <td>{row.isRequired ? 'Yes' : 'No'}</td>
                <td>
                  <div className="map-actions">
                    <button type="button" onClick={() => onMove(row.id, 'up')} title="Move QBO key up">
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(row.id, 'down')}
                      title="Move QBO key down"
                    >
                      ↓
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <span style={{ display: 'none' }}>{section}</span>
    </div>
  );
}

function buildValueLookup(header: any[], lines: any[]) {
  const map: Record<string, any> = {};
  for (const row of [...header, ...lines]) {
    map[row.qboKey ?? ''] = row.value;
  }
  return map;
}

function applyValueLookup(rows: any[], lookup: Record<string, any>) {
  return rows.map((r) => ({
    ...r,
    value: Object.prototype.hasOwnProperty.call(lookup, r.qboKey ?? '')
      ? lookup[r.qboKey ?? '']
      : r.value,
  }));
}

export function CustomerMappingsPage() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [header, setHeader] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [valueLookup, setValueLookup] = useState<Record<string, any>>({});
  const [invoiceId, setInvoiceId] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  function hydrate(data: any) {
    setWorkspace(data);
    setHeader(data.header || []);
    setLines(data.lines || []);
    setValueLookup(buildValueLookup(data.header || [], data.lines || []));
    if (data.sample?.Id) setInvoiceId(data.sample.Id);
    setDirty(false);
  }

  async function load(selected?: string) {
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const q = selected ? `?invoiceId=${encodeURIComponent(selected)}` : '';
      const data = await api(`/customer/mappings/workspace${q}`);
      hydrate(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function patchSection(
    section: 'HEADER' | 'LINE',
    updater: (rows: any[]) => any[],
  ) {
    const current = section === 'HEADER' ? header : lines;
    const nextRows = applyValueLookup(updater(current), valueLookup);
    if (section === 'HEADER') setHeader(nextRows);
    else setLines(nextRows);
    setDirty(true);
    setMsg('');
  }

  function swapLocal(section: 'HEADER' | 'LINE', fromId: string, toId: string) {
    patchSection(section, (rows) => {
      const a = rows.findIndex((r) => r.id === fromId);
      const b = rows.findIndex((r) => r.id === toId);
      if (a < 0 || b < 0) return rows;
      const copy = rows.map((r) => ({ ...r }));
      const tmpKey = copy[a].qboKey;
      const tmpVal = copy[a].value;
      copy[a] = { ...copy[a], qboKey: copy[b].qboKey, value: copy[b].value };
      copy[b] = { ...copy[b], qboKey: tmpKey, value: tmpVal };
      return copy;
    });
  }

  function moveLocal(section: 'HEADER' | 'LINE', id: string, direction: 'up' | 'down') {
    patchSection(section, (rows) => {
      const idx = rows.findIndex((r) => r.id === id);
      const swapWith = direction === 'up' ? idx - 1 : idx + 1;
      if (idx < 0 || swapWith < 0 || swapWith >= rows.length) return rows;
      const copy = rows.map((r) => ({ ...r }));
      const tmpKey = copy[idx].qboKey;
      const tmpVal = copy[idx].value;
      copy[idx] = { ...copy[idx], qboKey: copy[swapWith].qboKey, value: copy[swapWith].value };
      copy[swapWith] = { ...copy[swapWith], qboKey: tmpKey, value: tmpVal };
      return copy;
    });
  }

  function changeSourceLocal(section: 'HEADER' | 'LINE', id: string, sourceField: string) {
    patchSection(section, (rows) =>
      rows.map((r) =>
        r.id === id
          ? {
              ...r,
              qboKey: sourceField,
              value: Object.prototype.hasOwnProperty.call(valueLookup, sourceField)
                ? valueLookup[sourceField]
                : null,
            }
          : r,
      ),
    );
  }

  async function saveMappings() {
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const items = [...header, ...lines].map((r) => ({
        id: r.id,
        sourceField: r.qboKey ?? '',
      }));
      const next = await api('/customer/mappings/save', {
        method: 'POST',
        body: JSON.stringify({ items, invoiceId: invoiceId || undefined }),
      });
      hydrate(next);
      setMsg('Mappings saved successfully.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!workspace && !error) return <p>Loading field mappings…</p>;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Field mappings</h1>
          <p>
            Adjust QBO keys against PRA header/line fields, then click Save to persist.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {dirty && <span className="badge warn">Unsaved changes</span>}
          <button
            className="btn btn-primary"
            disabled={saving || !workspace}
            onClick={saveMappings}
          >
            {saving ? 'Saving…' : 'Save mappings'}
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}
      {msg && (
        <div className="card" style={{ marginBottom: 16, color: 'var(--ok)' }}>
          {msg}
        </div>
      )}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="toolbar">
          <StatusBadge status={workspace?.connected ? 'CONNECTED' : 'DISCONNECTED'} />
          <span style={{ color: 'var(--muted)' }}>
            {workspace?.companyName || 'Connect QuickBooks to load live sample values'}
          </span>
          {workspace?.invoices?.length > 0 && (
            <select
              value={invoiceId}
              onChange={(e) => {
                if (dirty && !confirm('Discard unsaved mapping changes?')) return;
                setInvoiceId(e.target.value);
                load(e.target.value);
              }}
            >
              {workspace.invoices.map((inv: any) => (
                <option key={inv.Id} value={inv.Id}>
                  #{inv.DocNumber} · {inv.Customer || 'Customer'} · {inv.TotalAmt}
                </option>
              ))}
            </select>
          )}
          <button
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => {
              if (dirty && !confirm('Discard unsaved mapping changes?')) return;
              load(invoiceId || undefined);
            }}
          >
            {busy ? 'Refreshing…' : 'Refresh sample'}
          </button>
          <Link className="btn btn-ghost" to="/app/connections">
            Connections
          </Link>
        </div>
        {workspace?.sample?.error && (
          <div className="error-box">{workspace.sample.error}</div>
        )}
        {workspace?.sample?.DocNumber && (
          <p className="map-hint" style={{ margin: 0 }}>
            Sample invoice <strong>#{workspace.sample.DocNumber}</strong> · {workspace.sample.Customer} ·{' '}
            {workspace.sample.TxnDate} · Total {workspace.sample.TotalAmt}
          </p>
        )}
      </div>

      {workspace && (
        <>
          <MappingSectionTable
            title="Header fields"
            hint="Invoice-level PRA payload"
            section="HEADER"
            rows={header}
            availableKeys={workspace.availableQboKeys || []}
            onSwap={(fromId, toId) => swapLocal('HEADER', fromId, toId)}
            onMove={(id, direction) => moveLocal('HEADER', id, direction)}
            onChangeSource={(id, sourceField) => changeSourceLocal('HEADER', id, sourceField)}
          />

          <MappingSectionTable
            title="Line item fields"
            hint="Repeating Items[] PRA payload (values from first sales line)"
            section="LINE"
            rows={lines}
            availableKeys={workspace.availableQboKeys || []}
            onSwap={(fromId, toId) => swapLocal('LINE', fromId, toId)}
            onMove={(id, direction) => moveLocal('LINE', id, direction)}
            onChangeSource={(id, sourceField) => changeSourceLocal('LINE', id, sourceField)}
          />
        </>
      )}
    </>
  );
}

export function CustomerBranchesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  async function load() {
    setRows(await api('/customer/branches'));
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Branches</h1>
          <p>Map outlets to PRA POS identifiers.</p>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid two">
          <div className="field">
            <label>Branch name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>City</label>
            <input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={async () => {
            if (!name) return;
            await api('/customer/branches', {
              method: 'POST',
              body: JSON.stringify({ name, city }),
            });
            setName('');
            setCity('');
            load();
          }}
        >
          Add branch
        </button>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>PRA POS ID</th>
              <th>Default</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.city || '—'}</td>
                <td>{b.praPosId || '—'}</td>
                <td>{b.isDefault ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function CustomerInvoicesPage() {
  const [qboInvoices, setQboInvoices] = useState<any[]>([]);
  const [tracked, setTracked] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);

  async function load() {
    setBusy(true);
    setError('');
    try {
      const conn = await api('/customer/connections');
      const isConnected = conn?.qbo?.status === 'CONNECTED';
      setConnected(isConnected);

      const trackedRows = await api('/customer/invoices');
      setTracked(trackedRows || []);

      if (isConnected) {
        const qbo = await api('/customer/qbo/invoices');
        setQboInvoices(qbo.invoices || []);
      } else {
        setQboInvoices([]);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const trackedByQboId = new Map(
    tracked.map((t) => [String(t.qboInvoiceId), t]),
  );

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Invoices</h1>
          <p>Live QuickBooks invoices with PRA tracking status.</p>
        </div>
        <button className="btn btn-ghost" disabled={busy} onClick={load}>
          {busy ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {!connected && (
        <div className="card" style={{ marginBottom: 16 }}>
          QuickBooks is not connected.{' '}
          <Link to="/app/connections">Connect QuickBooks</Link> to load invoices.
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>QuickBooks invoices</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Doc # (USIN)</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Balance</th>
              <th>PRA status</th>
              <th>Fiscal #</th>
            </tr>
          </thead>
          <tbody>
            {qboInvoices.map((inv) => {
              const track = trackedByQboId.get(String(inv.Id));
              return (
                <tr key={inv.Id}>
                  <td>{inv.DocNumber || inv.Id}</td>
                  <td>{inv.TxnDate || '—'}</td>
                  <td>{inv.CustomerRef?.name || '—'}</td>
                  <td>{inv.TotalAmt ?? '—'}</td>
                  <td>{inv.Balance ?? '—'}</td>
                  <td>
                    <StatusBadge status={track?.status || 'PENDING'} />
                  </td>
                  <td>{track?.fiscalInvoiceNo || '—'}</td>
                </tr>
              );
            })}
            {!qboInvoices.length && (
              <tr>
                <td colSpan={7} style={{ color: 'var(--muted)' }}>
                  {connected
                    ? 'No invoices returned from QuickBooks.'
                    : 'Connect QuickBooks to see live invoices here.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function CustomerLogsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    api('/customer/logs').then(setRows);
  }, []);
  return (
    <>
      <div className="topbar">
        <div>
          <h1>Activity</h1>
          <p>Workspace audit trail for connections and posts.</p>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Entity</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>{log.action}</td>
                <td>{log.entity || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
