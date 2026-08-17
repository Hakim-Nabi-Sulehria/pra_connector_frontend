import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../auth';

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
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/admin/overview')
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <p>Loading FBR dashboard…</p>;

  const k = data.kpis || {};
  return (
    <>
      <div className="topbar">
        <div>
          <h1>FBR Super Admin</h1>
          <p>Federal Board of Revenue — DI validate/post integration overview.</p>
        </div>
        <Link className="btn btn-primary" to="/admin/fbr/companies/new">
          + New FBR company
        </Link>
      </div>
      <div className="kpi-grid">
        <div className="card kpi">
          <span>Companies</span>
          <strong>{k.companies}</strong>
        </div>
        <div className="card kpi">
          <span>FBR connected</span>
          <strong>{k.connectedFbr}</strong>
        </div>
        <div className="card kpi">
          <span>Posted (FBR invoice no.)</span>
          <strong>{k.postedInvoices}</strong>
        </div>
        <div className="card kpi">
          <span>Failed</span>
          <strong>{k.failedInvoices}</strong>
        </div>
      </div>
    </>
  );
}

export function FbrCustomerDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api('/fbr/customer/connections').then(setData).catch(() => setData(null));
  }, []);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>FBR workspace</h1>
          <p>{user?.organization?.name} — QuickBooks → FBR DI validate/post</p>
        </div>
      </div>
      <div className="card">
        <h3>Integration status</h3>
        <p>
          QuickBooks: <StatusBadge status={data?.qbo?.status} />
        </p>
        <p>
          FBR DI: <StatusBadge status={data?.fbr?.status} />
        </p>
        <p className="map-hint">
          FBR returns an <strong>FBR invoice number</strong> on post — separate from PRA fiscal
          numbers. Super Admin configures seller NTN and bearer token.
        </p>
        <Link className="btn btn-primary" to="/fbr/app/connections">
          Open connections
        </Link>
        <Link className="btn btn-ghost" to="/fbr/app/invoices" style={{ marginLeft: 8 }}>
          Invoices
        </Link>
      </div>
    </>
  );
}

export function FbrCustomerConnectionsPage() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/fbr/customer/connections')
      .then(setData)
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Connections</h1>
          <p>QuickBooks Online + FBR DI API (direct PRAL gateway).</p>
        </div>
      </div>
      {err && <div className="error-box">{err}</div>}
      <div className="card">
        <h3>QuickBooks Online</h3>
        <p>
          Status: <StatusBadge status={data?.qbo?.status} />
        </p>
        <p className="map-hint">Use the same QBO OAuth flow from the PRA connector QBO module.</p>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>FBR / PRAL DI</h3>
        <p>
          Status: <StatusBadge status={data?.fbr?.status} />
        </p>
        <div className="step-list">
          <div className="step-item">
            <span>Seller NTN/CNIC</span>
            <strong>{data?.fbr?.sellerNTNCNIC || '—'}</strong>
          </div>
          <div className="step-item">
            <span>Seller name</span>
            <strong>{data?.fbr?.sellerBusinessName || '—'}</strong>
          </div>
          <div className="step-item">
            <span>Environment</span>
            <strong>{(data?.fbr?.environment || 'sandbox').toUpperCase()}</strong>
          </div>
          <div className="step-item">
            <span>API base</span>
            <strong>{data?.fbr?.apiBaseUrl || 'https://gw.fbr.gov.pk'}</strong>
          </div>
          <div className="step-item">
            <span>Bearer token</span>
            <strong>{data?.fbr?.hasToken ? 'Configured' : 'Not set'}</strong>
          </div>
        </div>
        <p className="map-hint" style={{ marginTop: 12 }}>
          Direct endpoints: <code>/di_data/v1/di/validateinvoicedata_sb</code> then{' '}
          <code>/di_data/v1/di/postinvoicedata_sb</code> (sandbox). Validate must pass before
          post with the same payload.
        </p>
      </div>
    </>
  );
}

export function FbrCustomerInvoicesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [scenario, setScenario] = useState<'SN001' | 'SN002'>('SN001');

  async function load() {
    setErr('');
    try {
      const data = await api<any[]>('/fbr/customer/invoices');
      setRows(data);
    } catch (e: any) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

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

  return (
    <>
      <div className="topbar">
        <div>
          <h1>FBR invoices</h1>
          <p>Validate then post to PRAL DI — stores FBR invoice number (not PRA fiscal no).</p>
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
      {msg && <div className="card" style={{ marginBottom: 12, borderColor: 'var(--teal)' }}>{msg}</div>}
      {err && <div className="error-box">{err}</div>}
      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Doc #</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>FBR invoice no.</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.qboInvoiceId}>
                <td>{r.docNumber || r.qboInvoiceId}</td>
                <td>{r.customerName}</td>
                <td>{r.total}</td>
                <td>
                  <StatusBadge status={r.tracked?.status || 'PENDING'} />
                </td>
                <td>{r.fbrInvoiceNo || '—'}</td>
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
          </tbody>
        </table>
        {!rows.length && <p style={{ color: 'var(--muted)' }}>Connect QBO and sync invoices first.</p>}
      </div>
    </>
  );
}
