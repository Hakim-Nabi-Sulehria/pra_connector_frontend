import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';

function StatusBadge({ status }: { status?: string }) {
  const s = (status || 'DISCONNECTED').toUpperCase();
  return <span className={`badge ${s === 'CONNECTED' ? 'ok' : 'muted'}`}>{s}</span>;
}

export function AdminFbrCompaniesListPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<any[]>('/admin/companies')
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="topbar">
        <div>
          <h1>FBR companies</h1>
          <p>Tenant companies for FBR DI integration — isolated from PRA records.</p>
        </div>
        <Link className="btn btn-primary" to="/admin/fbr/companies/new">
          + New
        </Link>
      </div>
      {error && <div className="error-box">{error}</div>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Admin email</th>
                <th>Seller NTN</th>
                <th>FBR</th>
                <th>QBO</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.adminEmail}</td>
                  <td>{r.fbr?.sellerNTNCNIC || '—'}</td>
                  <td>
                    <StatusBadge status={r.fbr?.status} />
                  </td>
                  <td>
                    <StatusBadge status={r.qbo?.status} />
                  </td>
                  <td>
                    <Link to={`/admin/fbr/companies/${r.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function AdminFbrCompanyCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: '',
    companyEmail: '',
    password: '',
    environment: 'sandbox' as 'sandbox' | 'production',
    sellerNTNCNIC: '',
    sellerBusinessName: '',
    sellerProvince: '',
    sellerAddress: '',
    fbrToken: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const created = await api('/admin/companies', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      navigate(`/admin/fbr/companies/${created.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>New FBR company</h1>
          <p>Creates an FBR-mode organization and admin user (separate from PRA).</p>
        </div>
      </div>
      <form className="card" onSubmit={onSubmit} style={{ maxWidth: 560 }}>
        {error && <div className="error-box">{error}</div>}
        {(
          [
            ['companyName', 'Company name'],
            ['companyEmail', 'Admin email'],
            ['password', 'Admin password'],
            ['sellerNTNCNIC', 'Seller NTN/CNIC'],
            ['sellerBusinessName', 'Seller business name'],
            ['sellerProvince', 'Seller province'],
            ['sellerAddress', 'Seller address'],
            ['fbrToken', 'FBR bearer token'],
          ] as const
        ).map(([key, label]) => (
          <div className="field" key={key}>
            <label>{label}</label>
            <input
              type={key === 'password' || key === 'fbrToken' ? 'password' : 'text'}
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required={key !== 'fbrToken' && key !== 'sellerProvince' && key !== 'sellerAddress'}
            />
          </div>
        ))}
        <div className="field">
          <label>Environment</label>
          <select
            value={form.environment}
            onChange={(e) =>
              setForm({ ...form, environment: e.target.value as 'sandbox' | 'production' })
            }
          >
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
        </div>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Creating…' : 'Create FBR company'}
        </button>
      </form>
    </>
  );
}

export function AdminFbrCompanyDetailPage() {
  const { id } = useParams();
  const [company, setCompany] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api(`/admin/companies/${id}`);
    setCompany(data);
    setForm({
      companyName: data.name,
      companyEmail: data.adminEmail || '',
      password: '',
      environment: data.fbr?.environment || 'sandbox',
      sellerNTNCNIC: data.fbr?.sellerNTNCNIC || '',
      sellerBusinessName: data.fbr?.sellerBusinessName || '',
      sellerProvince: data.fbr?.sellerProvince || '',
      sellerAddress: data.fbr?.sellerAddress || '',
      fbrToken: '',
    });
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [id]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMsg('');
    try {
      await api(`/admin/companies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setMsg('Saved');
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!company) return error ? <div className="error-box">{error}</div> : <p>Loading…</p>;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>{company.name}</h1>
          <p>FBR DI configuration — direct PRAL gateway API.</p>
        </div>
        <Link className="btn btn-ghost" to="/admin/fbr/companies">
          Back
        </Link>
      </div>
      <form className="card" onSubmit={save} style={{ maxWidth: 560 }}>
        {error && <div className="error-box">{error}</div>}
        {msg && <p style={{ color: 'var(--teal)' }}>{msg}</p>}
        <div className="field">
          <label>Company name</label>
          <input
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Admin email</label>
          <input
            value={form.companyEmail}
            onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
          />
        </div>
        <div className="field">
          <label>New password (optional)</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Seller NTN/CNIC</label>
          <input
            value={form.sellerNTNCNIC}
            onChange={(e) => setForm({ ...form, sellerNTNCNIC: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Seller business name</label>
          <input
            value={form.sellerBusinessName}
            onChange={(e) => setForm({ ...form, sellerBusinessName: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Seller province</label>
          <input
            value={form.sellerProvince}
            onChange={(e) => setForm({ ...form, sellerProvince: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Seller address</label>
          <input
            value={form.sellerAddress}
            onChange={(e) => setForm({ ...form, sellerAddress: e.target.value })}
          />
        </div>
        <div className="field">
          <label>FBR bearer token {company.fbr?.hasToken ? '(leave blank to keep)' : ''}</label>
          <input
            type="password"
            value={form.fbrToken}
            onChange={(e) => setForm({ ...form, fbrToken: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Environment</label>
          <select
            value={form.environment}
            onChange={(e) => setForm({ ...form, environment: e.target.value })}
          >
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
        </div>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>
    </>
  );
}
