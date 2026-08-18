import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { PageLoader } from '../components/PageLoader';

function StatusBadge({ status }: { status?: string }) {
  const s = (status || 'DISCONNECTED').toUpperCase();
  const cls =
    s === 'CONNECTED' || s === 'POSTED' || s === 'ACTIVE'
      ? 'ok'
      : s === 'ERROR' || s === 'FAILED' || s === 'INACTIVE'
        ? 'danger'
        : 'muted';
  return <span className={`badge ${cls}`}>{s}</span>;
}

const DEFAULT_FBR: Record<'sandbox' | 'production', string> = {
  sandbox: 'https://gw.fbr.gov.pk',
  production: 'https://gw.fbr.gov.pk',
};

type FbrCompanyForm = {
  companyName: string;
  companyEmail: string;
  password: string;
  environment: 'sandbox' | 'production';
  fbrApiUrl: string;
  fbrToken: string;
  sellerNTNCNIC: string;
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
};

function FbrCompanyFormFields({
  form,
  setForm,
  disabled,
  isEdit,
  hasExistingToken,
}: {
  form: FbrCompanyForm;
  setForm: (f: FbrCompanyForm) => void;
  disabled: boolean;
  isEdit: boolean;
  hasExistingToken?: boolean;
}) {
  function setEnvironment(environment: 'sandbox' | 'production') {
    setForm({
      ...form,
      environment,
      fbrApiUrl: DEFAULT_FBR[environment],
    });
  }

  return (
    <>
      <div className="form-section-title">Workspace</div>
      <div className="form-grid">
        <div className="field">
          <label>Company name</label>
          <input
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            required
            disabled={disabled}
          />
        </div>
        <div className="field">
          <label>Admin email</label>
          <input
            type="email"
            value={form.companyEmail}
            onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
            required
            disabled={disabled}
          />
        </div>
        <div className="field span-2">
          <label>{isEdit ? 'New password (optional)' : 'Password'}</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder={isEdit ? 'Leave blank to keep current password' : 'Min. 8 characters'}
            required={!isEdit}
            disabled={disabled}
            minLength={isEdit ? undefined : 8}
          />
        </div>
      </div>

      <div className="form-section-title">Seller identity</div>
      <div className="form-grid">
        <div className="field">
          <label>Seller NTN/CNIC</label>
          <input
            value={form.sellerNTNCNIC}
            onChange={(e) => setForm({ ...form, sellerNTNCNIC: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="field">
          <label>Seller business name</label>
          <input
            value={form.sellerBusinessName}
            onChange={(e) => setForm({ ...form, sellerBusinessName: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="field">
          <label>Seller province</label>
          <input
            value={form.sellerProvince}
            onChange={(e) => setForm({ ...form, sellerProvince: e.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="field">
          <label>Seller address</label>
          <input
            value={form.sellerAddress}
            onChange={(e) => setForm({ ...form, sellerAddress: e.target.value })}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="form-section-title">FBR DI API</div>
      <div className="form-grid">
        <div className="field span-2">
          <label>FBR environment</label>
          <div className="env-segment" aria-label="FBR environment">
            <button
              type="button"
              className={form.environment === 'sandbox' ? 'active' : ''}
              disabled={disabled}
              onClick={() => setEnvironment('sandbox')}
            >
              Sandbox
            </button>
            <button
              type="button"
              className={form.environment === 'production' ? 'active' : ''}
              disabled={disabled}
              onClick={() => setEnvironment('production')}
            >
              Production
            </button>
          </div>
        </div>
        <div className="field span-2">
          <label>FBR API URL</label>
          <input
            value={form.fbrApiUrl}
            onChange={(e) => setForm({ ...form, fbrApiUrl: e.target.value })}
            placeholder={DEFAULT_FBR[form.environment]}
            disabled={disabled}
          />
        </div>
        <div className="field span-2">
          <label>FBR API token</label>
          <input
            type="password"
            value={form.fbrToken}
            onChange={(e) => setForm({ ...form, fbrToken: e.target.value })}
            placeholder={
              isEdit && hasExistingToken
                ? 'Token saved — enter a new value to replace'
                : 'Bearer token for FBR'
            }
            disabled={disabled}
          />
          {isEdit && hasExistingToken && !form.fbrToken && (
            <p className="field-hint">Token already saved.</p>
          )}
        </div>
      </div>
    </>
  );
}

function emptyForm(): FbrCompanyForm {
  return {
    companyName: '',
    companyEmail: '',
    password: '',
    environment: 'sandbox',
    fbrApiUrl: DEFAULT_FBR.sandbox,
    fbrToken: '',
    sellerNTNCNIC: '',
    sellerBusinessName: '',
    sellerProvince: '',
    sellerAddress: '',
  };
}

function formFromCompany(data: any): FbrCompanyForm {
  const environment = data.fbr?.environment === 'production' ? 'production' : 'sandbox';
  return {
    companyName: data.name || '',
    companyEmail: data.adminEmail || '',
    password: '',
    environment,
    fbrApiUrl: data.fbr?.apiBaseUrl || DEFAULT_FBR[environment],
    fbrToken: '',
    sellerNTNCNIC: data.fbr?.sellerNTNCNIC || '',
    sellerBusinessName: data.fbr?.sellerBusinessName || '',
    sellerProvince: data.fbr?.sellerProvince || '',
    sellerAddress: data.fbr?.sellerAddress || '',
  };
}

export function AdminFbrCompaniesListPage() {
  const navigate = useNavigate();
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
          <div className="crumb">FBR · Tenants</div>
          <h1>Companies</h1>
        </div>
        <Link className="btn btn-primary" to="/admin/fbr/companies/new">
          + New
        </Link>
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="card">
        {loading ? (
          <PageLoader label="Loading companies…" />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Email</th>
                  <th>NTN</th>
                  <th>Environment</th>
                  <th>QBO</th>
                  <th>FBR</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((org) => (
                  <tr
                    key={org.id}
                    className="clickable-row"
                    onClick={() => navigate(`/admin/fbr/companies/${org.id}`)}
                  >
                    <td>
                      <strong>{org.name}</strong>
                    </td>
                    <td>{org.adminEmail || '—'}</td>
                    <td>{org.fbr?.sellerNTNCNIC || '—'}</td>
                    <td>
                      <span className="badge muted">
                        {(org.fbr?.environment || 'sandbox').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={org.qbo?.status} />
                    </td>
                    <td>
                      <StatusBadge status={org.fbr?.status} />
                    </td>
                    <td>
                      {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={7} style={{ color: 'var(--muted)', padding: 24 }}>
                      No FBR companies yet. Click <strong>New</strong> to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export function AdminFbrCompanyCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FbrCompanyForm>(emptyForm);
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
          <div className="crumb">
            <Link to="/admin/fbr/companies">Companies</Link>
            <span>/</span>
            <span>New</span>
          </div>
          <h1>New FBR company</h1>
        </div>
        <Link className="btn btn-ghost" to="/admin/fbr/companies">
          Back to list
        </Link>
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="card form-card wide">
        <form onSubmit={onSubmit}>
          <FbrCompanyFormFields form={form} setForm={setForm} disabled={false} isEdit={false} />
          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create company'}
            </button>
            <Link className="btn btn-ghost" to="/admin/fbr/companies">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}

export function AdminFbrCompanyDetailPage() {
  const { id } = useParams();
  const [company, setCompany] = useState<any>(null);
  const [form, setForm] = useState<FbrCompanyForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const data = await api(`/admin/companies/${id}`);
    setCompany(data);
    setForm(formFromCompany(data));
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const body: Record<string, string> = {
        companyName: form.companyName,
        companyEmail: form.companyEmail,
        environment: form.environment,
        fbrApiUrl: form.fbrApiUrl,
        sellerNTNCNIC: form.sellerNTNCNIC,
        sellerBusinessName: form.sellerBusinessName,
        sellerProvince: form.sellerProvince,
        sellerAddress: form.sellerAddress,
      };
      if (form.password.trim()) body.password = form.password;
      if (form.fbrToken.trim()) body.fbrToken = form.fbrToken;
      const updated = await api(`/admin/companies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setCompany({ ...updated, fbrInvoices: updated.fbrInvoices || company.fbrInvoices });
      setForm(formFromCompany(updated));
      setEditing(false);
      setMsg('Company updated successfully.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <PageLoader label="Loading company…" />;
  if (!company || !form) return error ? <div className="error-box">{error}</div> : null;

  const env = (company.fbr?.environment || 'sandbox').toUpperCase();
  const invoices = company.fbrInvoices || [];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">
            <Link to="/admin/fbr/companies">Companies</Link>
            <span>/</span>
            <span>{company.name}</span>
          </div>
          <h1>{company.name}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!editing ? (
            <button className="btn btn-primary" type="button" onClick={() => setEditing(true)}>
              Edit
            </button>
          ) : null}
          <Link className="btn btn-ghost" to="/admin/fbr/companies">
            Back to list
          </Link>
        </div>
      </div>

      {msg && <div className="card flash-ok">{msg}</div>}
      {error && <div className="error-box">{error}</div>}

      <div className="card identity-card">
        <div>
          <div className="identity-kicker">FBR tenant</div>
          <h2>{company.fbr?.sellerBusinessName || company.name}</h2>
          <div className="identity-meta">
            <span>{company.adminEmail || 'No admin email'}</span>
            <span>NTN {company.fbr?.sellerNTNCNIC || 'not set'}</span>
            {company.fbr?.sellerProvince && <span>{company.fbr.sellerProvince}</span>}
            {company.createdAt && (
              <span>Created {new Date(company.createdAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        <div className="chip-row">
          <span className="badge muted">{env}</span>
          <span className={`badge ${company.fbr?.hasToken ? 'ok' : 'muted'}`}>
            {company.fbr?.hasToken ? 'Token configured' : 'No token'}
          </span>
          <StatusBadge status={company.isActive === false ? 'INACTIVE' : 'ACTIVE'} />
        </div>
      </div>

      <div className="grid three" style={{ marginBottom: 16 }}>
        <div className="card kpi-card">
          <div className="kpi-label">QuickBooks Online</div>
          <div style={{ marginTop: 8 }}>
            <StatusBadge status={company.qbo?.status} />
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
              {company.qbo?.companyName || 'Not connected'}
            </div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label">FBR DI</div>
          <div style={{ marginTop: 8 }}>
            <StatusBadge status={company.fbr?.status} />
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
              {env}
              {company.fbr?.lastPostedAt
                ? ` · last post ${new Date(company.fbr.lastPostedAt).toLocaleDateString()}`
                : ' · no posts yet'}
            </div>
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label">Seller</div>
          <div style={{ marginTop: 8, fontWeight: 700 }}>
            {company.fbr?.sellerNTNCNIC || '—'}
          </div>
          <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
            {company.fbr?.sellerAddress || company.fbr?.sellerProvince || 'Address not set'}
          </div>
        </div>
      </div>

      <div className="card form-card wide">
        <form onSubmit={save}>
          <FbrCompanyFormFields
            form={form}
            setForm={setForm}
            disabled={!editing}
            isEdit
            hasExistingToken={company.fbr?.hasToken}
          />
          {editing && (
            <div className="form-actions">
              <button className="btn btn-primary" disabled={busy}>
                {busy ? 'Saving…' : 'Update'}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setError('');
                  setForm(formFromCompany(company));
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Recent FBR invoices</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Customer</th>
                <th>Status</th>
                <th>FBR invoice no.</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length ? (
                invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td>{new Date(inv.postedAt || inv.createdAt).toLocaleString()}</td>
                    <td>{inv.customerName || inv.qboInvoiceId}</td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td>{inv.fbrInvoiceNo || '—'}</td>
                    <td>{inv.totalAmount ?? '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--muted)', padding: 20 }}>
                    No DI posts for this company yet.
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
