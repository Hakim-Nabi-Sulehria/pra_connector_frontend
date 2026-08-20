import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { PageLoader } from '../components/PageLoader';
import type { IntegrationMode } from '../lib/api';

function formatAction(action?: string) {
  return (action || '—').replace(/_/g, ' ');
}

export function AdminAuditLogsPage({ mode }: { mode: IntegrationMode }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const authority = mode === 'FBR' ? 'FBR' : 'PRA';

  useEffect(() => {
    setRows(null);
    api<any[]>('/admin/logs')
      .then(setRows)
      .catch((e) => setError(e.message));
  }, [mode]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows || [];
    return (rows || []).filter((log) =>
      [log.action, log.entity, log.user?.fullName, log.user?.email, log.organization?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [q, rows]);

  if (error) return <div className="error-box">{error}</div>;
  if (!rows) return <PageLoader label="Loading audit logs…" />;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">{authority} operations</div>
          <h1>Audit logs</h1>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search action, user, company"
          style={{ borderRadius: 12, border: '1px solid var(--line)', padding: '10px 12px', minWidth: 260 }}
        />
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>Actor</th>
                <th>Organization</th>
                <th>Entity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? (
                filtered.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{formatAction(log.action)}</td>
                    <td>{log.user?.fullName || log.user?.email || '—'}</td>
                    <td>{log.organization?.name || '—'}</td>
                    <td>{log.entity || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--muted)', padding: 20 }}>
                    No audit events match this filter.
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
