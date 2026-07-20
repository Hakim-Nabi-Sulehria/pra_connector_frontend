import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';

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

const DEFAULT_PRA: Record<'sandbox' | 'production', string> = {
  sandbox: 'https://ims.pral.com.pk/ims/sandbox/api/Live/PostData',
  production: 'https://ims.pral.com.pk/ims/production/api/Live/PostData',
};

type CompanyFilters = {
  q: string;
  environment: '' | 'sandbox' | 'production';
  qbo: '' | 'CONNECTED' | 'DISCONNECTED';
  pra: '' | 'CONNECTED' | 'DISCONNECTED';
  active: '' | 'true' | 'false';
};

const emptyFilters: CompanyFilters = {
  q: '',
  environment: '',
  qbo: '',
  pra: '',
  active: '',
};

function filtersToQuery(f: CompanyFilters) {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set('q', f.q.trim());
  if (f.environment) p.set('environment', f.environment);
  if (f.qbo) p.set('qbo', f.qbo);
  if (f.pra) p.set('pra', f.pra);
  if (f.active) p.set('active', f.active);
  const qs = p.toString();
  return qs ? `?${qs}` : '';
}

export function AdminCompaniesListPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [filters, setFilters] = useState<CompanyFilters>(emptyFilters);
  const [draft, setDraft] = useState<CompanyFilters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(f = filters) {
    setLoading(true);
    setError('');
    try {
      const data = await api(`/admin/companies${filtersToQuery(f)}`);
      setRows(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeFilterCount = useMemo(
    () =>
      Object.entries(filters).filter(([, v]) => v !== '').length,
    [filters],
  );

  return (
    <>
      <div className="topbar">
        <div>
          <h1>Companies</h1>
          <p>Manage tenant companies, login credentials, and PRA integration.</p>
        </div>
        <Link className="btn btn-primary" to="/admin/companies/new">
          + New
        </Link>
      </div>

      <div className="card filter-bar" style={{ marginBottom: 16 }}>
        <div className="filter-grid">
          <div className="field" style={{ margin: 0 }}>
            <label>Search</label>
            <input
              value={draft.q}
              onChange={(e) => setDraft({ ...draft, q: e.target.value })}
              placeholder="Company name or email"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setFilters(draft);
                  load(draft);
                }
              }}
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>PRA environment</label>
            <select
              value={draft.environment}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  environment: e.target.value as CompanyFilters['environment'],
                })
              }
            >
              <option value="">All</option>
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>QBO status</label>
            <select
              value={draft.qbo}
              onChange={(e) =>
                setDraft({ ...draft, qbo: e.target.value as CompanyFilters['qbo'] })
              }
            >
              <option value="">All</option>
              <option value="CONNECTED">Connected</option>
              <option value="DISCONNECTED">Disconnected</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>PRA status</label>
            <select
              value={draft.pra}
              onChange={(e) =>
                setDraft({ ...draft, pra: e.target.value as CompanyFilters['pra'] })
              }
            >
              <option value="">All</option>
              <option value="CONNECTED">Connected</option>
              <option value="DISCONNECTED">Disconnected</option>
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label>Company status</label>
            <select
              value={draft.active}
              onChange={(e) =>
                setDraft({ ...draft, active: e.target.value as CompanyFilters['active'] })
              }
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
        <div className="filter-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setFilters(draft);
              load(draft);
            }}
          >
            Apply filters
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setDraft(emptyFilters);
              setFilters(emptyFilters);
              load(emptyFilters);
            }}
          >
            Clear{activeFilterCount ? ` (${activeFilterCount})` : ''}
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Loading companies…</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Environment</th>
                  <th>QBO</th>
                  <th>PRA</th>
                  <th>Status</th>
                  <th>Invoices</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((org) => (
                  <tr
                    key={org.id}
                    className="clickable-row"
                    onClick={() => navigate(`/admin/companies/${org.id}`)}
                  >
                    <td>
                      <strong>{org.name}</strong>
                    </td>
                    <td>{org.adminEmail || '—'}</td>
                    <td>
                      <span className="badge muted">
                        {(org.pra?.environment || 'sandbox').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={org.qbo?.status} />
                    </td>
                    <td>
                      <StatusBadge status={org.pra?.status} />
                    </td>
                    <td>
                      <StatusBadge status={org.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td>{org._count?.invoices ?? 0}</td>
                    <td>{new Date(org.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={8} style={{ color: 'var(--muted)', padding: 24 }}>
                      No companies match your filters. Click <strong>New</strong> to add one.
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

type CompanyFormState = {
  companyName: string;
  companyEmail: string;
  password: string;
  praApiUrl: string;
  praToken: string;
  environment: 'sandbox' | 'production';
};

function CompanyFormFields({
  form,
  setForm,
  disabled,
  isEdit,
  hasExistingToken,
}: {
  form: CompanyFormState;
  setForm: (f: CompanyFormState) => void;
  disabled: boolean;
  isEdit: boolean;
  hasExistingToken?: boolean;
}) {
  function setEnvironment(environment: 'sandbox' | 'production') {
    setForm({
      ...form,
      environment,
      praApiUrl: DEFAULT_PRA[environment],
    });
  }

  return (
    <>
      <div className="field">
        <label>Company name</label>
        <input
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          placeholder="Fenzi Enterprises Pvt Ltd"
          required
          disabled={disabled}
        />
      </div>
      <div className="field">
        <label>Company email</label>
        <input
          type="email"
          value={form.companyEmail}
          onChange={(e) => setForm({ ...form, companyEmail: e.target.value })}
          placeholder="admin@company.com"
          required
          disabled={disabled}
        />
      </div>
      <div className="field">
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
      <div className="field">
        <label>PRA environment</label>
        <div className="env-segment" aria-label="PRA environment">
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
      <div className="field">
        <label>PRA API URL</label>
        <input
          value={form.praApiUrl}
          onChange={(e) => setForm({ ...form, praApiUrl: e.target.value })}
          placeholder={DEFAULT_PRA[form.environment]}
          disabled={disabled}
        />
      </div>
      <div className="field">
        <label>PRA API token</label>
        <input
          type="password"
          value={form.praToken}
          onChange={(e) => setForm({ ...form, praToken: e.target.value })}
          placeholder={
            isEdit && hasExistingToken
              ? 'Token saved — enter a new value to replace'
              : 'Bearer token for PRA'
          }
          disabled={disabled}
        />
        {isEdit && hasExistingToken && !form.praToken && (
          <p className="field-hint">A token is already configured for this company.</p>
        )}
      </div>
    </>
  );
}

export function AdminCompanyCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<CompanyFormState>({
    companyName: '',
    companyEmail: '',
    password: '',
    praApiUrl: DEFAULT_PRA.sandbox,
    praToken: '',
    environment: 'sandbox',
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
      navigate(`/admin/companies/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create company');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1>New company</h1>
          <p>Create a tenant workspace with login and PRA credentials.</p>
        </div>
        <Link className="btn btn-ghost" to="/admin/companies">
          Back to list
        </Link>
      </div>
      {error && <div className="error-box">{error}</div>}
      <div className="card form-card">
        <form onSubmit={onSubmit}>
          <CompanyFormFields form={form} setForm={setForm} disabled={false} isEdit={false} />
          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={busy}>
              {busy ? 'Creating…' : 'Create company'}
            </button>
            <Link className="btn btn-ghost" to="/admin/companies">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}

export function AdminCompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<any>(null);
  const [form, setForm] = useState<CompanyFormState | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await api(`/admin/companies/${id}`);
      setCompany(data);
      setForm({
        companyName: data.name || '',
        companyEmail: data.adminEmail || '',
        password: '',
        praApiUrl: data.pra?.apiUrl || DEFAULT_PRA[(data.pra?.environment === 'production' ? 'production' : 'sandbox')],
        praToken: '',
        environment: data.pra?.environment === 'production' ? 'production' : 'sandbox',
      });
    } catch (e: any) {
      setError(e.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function onUpdate(e: FormEvent) {
    e.preventDefault();
    if (!id || !form) return;
    setBusy(true);
    setError('');
    setMsg('');
    try {
      const body: Record<string, string> = {
        companyName: form.companyName,
        companyEmail: form.companyEmail,
        praApiUrl: form.praApiUrl,
        environment: form.environment,
      };
      if (form.password.trim()) body.password = form.password;
      if (form.praToken.trim()) body.praToken = form.praToken;

      const updated = await api(`/admin/companies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setCompany(updated);
      setForm({
        companyName: updated.name || '',
        companyEmail: updated.adminEmail || '',
        password: '',
        praApiUrl: updated.pra?.apiUrl || DEFAULT_PRA[(updated.pra?.environment === 'production' ? 'production' : 'sandbox')],
        praToken: '',
        environment: updated.pra?.environment === 'production' ? 'production' : 'sandbox',
      });
      setEditing(false);
      setMsg('Company updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update company');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p style={{ padding: 8 }}>Loading company…</p>;
  if (error && !company) return <div className="error-box">{error}</div>;
  if (!company || !form) return null;

  return (
    <>
      <div className="topbar">
        <div>
          <h1>{company.name}</h1>
          <p>Company profile, login, and PRA integration settings.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!editing ? (
            <button className="btn btn-primary" type="button" onClick={() => setEditing(true)}>
              Edit
            </button>
          ) : null}
          <Link className="btn btn-ghost" to="/admin/companies">
            Back to list
          </Link>
        </div>
      </div>

      {msg && (
        <div className="card" style={{ marginBottom: 16, color: 'var(--ok)' }}>
          {msg}
        </div>
      )}
      {error && <div className="error-box">{error}</div>}

      <div className="grid two" style={{ marginBottom: 16 }}>
        <div className="card kpi-card">
          <div className="kpi-label">QBO</div>
          <div style={{ marginTop: 8 }}>
            <StatusBadge status={company.qbo?.status} />
            {company.qbo?.companyName && (
              <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
                {company.qbo.companyName}
              </div>
            )}
          </div>
        </div>
        <div className="card kpi-card">
          <div className="kpi-label">PRA</div>
          <div style={{ marginTop: 8 }}>
            <StatusBadge status={company.pra?.status} />
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
              {(company.pra?.environment || 'sandbox').toUpperCase()}
              {company.pra?.hasToken ? ' · token configured' : ' · no token'}
            </div>
          </div>
        </div>
      </div>

      <div className="card form-card">
        <form onSubmit={onUpdate}>
          <CompanyFormFields
            form={form}
            setForm={setForm}
            disabled={!editing}
            isEdit
            hasExistingToken={company.pra?.hasToken}
          />
          {editing && (
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Update'}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setError('');
                  setForm({
                    companyName: company.name || '',
                    companyEmail: company.adminEmail || '',
                    password: '',
                    praApiUrl:
                      company.pra?.apiUrl ||
                      DEFAULT_PRA[(company.pra?.environment === 'production' ? 'production' : 'sandbox')],
                    praToken: '',
                    environment:
                      company.pra?.environment === 'production' ? 'production' : 'sandbox',
                  });
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}
