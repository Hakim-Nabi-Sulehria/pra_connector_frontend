import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

type QboEnv = 'sandbox' | 'production';

type QboConfigResponse = {
  activeEnvironment: QboEnv;
  credentials: {
    sandbox: { clientId: string | null; clientSecretMasked?: string | null; hasClientSecret: boolean };
    production: { clientId: string | null; clientSecretMasked?: string | null; hasClientSecret: boolean };
  };
};

export function AdminQboConfigPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<QboConfigResponse | null>(null);

  const [envSelected, setEnvSelected] = useState<QboEnv>('sandbox');
  const [editing, setEditing] = useState(false);

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<QboConfigResponse>('/admin/qbo/config')
      .then((d) => {
        setData(d);
        setEnvSelected(d.activeEnvironment);
      })
      .catch((e: any) => setError(e.message || 'Failed to load QBO config'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!data) return;
    const creds = data.credentials[envSelected];
    setClientId(creds.clientId ?? '');
    // keep secret input blank; user enters only when updating
    setClientSecret('');
  }, [data, envSelected]);

  async function onSave() {
    if (!data) return;
    if (!clientId.trim()) {
      setError('Client ID is required');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/admin/qbo/config', {
        method: 'PATCH',
        body: JSON.stringify({
          environment: envSelected,
          activeEnvironment: envSelected,
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim() ? clientSecret.trim() : undefined,
        }),
      });
      const next = await api<QboConfigResponse>('/admin/qbo/config');
      setData(next);
      setEditing(false);
      setClientSecret('');
    } catch (e: any) {
      setError(e.message || 'Failed to save QBO config');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p style={{ padding: 8 }}>Loading QBO configuration…</p>;
  if (error && !data) return <div className="error-box">{error}</div>;
  if (!data) return null;

  const creds = data.credentials[envSelected];

  return (
    <>
      <div className="topbar">
        <div>
          <h1>QuickBooks Online Configuration</h1>
          <p>Manage Intuit OAuth credentials for sandbox and production.</p>
        </div>
        <Link className="btn btn-ghost" to="/admin/companies">
          Back
        </Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="card form-card">
        <div className="field">
          <label>Environment</label>
          <div className="env-segment" aria-label="QBO environment">
            <button
              type="button"
              className={envSelected === 'sandbox' ? 'active' : ''}
              disabled={busy}
              onClick={() => setEnvSelected('sandbox')}
            >
              Sandbox
            </button>
            <button
              type="button"
              className={envSelected === 'production' ? 'active' : ''}
              disabled={busy}
              onClick={() => setEnvSelected('production')}
            >
              Production
            </button>
          </div>
        </div>

        <div className="field">
          <label>Client ID</label>
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={!editing || busy}
            placeholder="Intuit Developer app Client ID"
          />
        </div>

        <div className="field">
          <label>Client Secret</label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            disabled={!editing || busy}
            placeholder={
              editing
                ? creds.hasClientSecret
                  ? 'Leave blank to keep current secret'
                  : 'Client secret for this environment'
                : creds.hasClientSecret
                  ? 'Configured'
                  : 'Not configured'
            }
          />
          {!editing && creds.hasClientSecret && (
            <p className="field-hint">Secret is already configured. Click Edit to change it.</p>
          )}
        </div>

        <div className="form-actions">
          {!editing ? (
            <button className="btn btn-primary" type="button" onClick={() => setEditing(true)} disabled={busy}>
              Edit
            </button>
          ) : (
            <>
              <button className="btn btn-primary" type="button" disabled={busy} onClick={onSave}>
                {busy ? 'Saving…' : 'Save'}
              </button>
              <button
                className="btn btn-ghost"
                type="button"
                disabled={busy}
                onClick={() => {
                  setEditing(false);
                  setError('');
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

