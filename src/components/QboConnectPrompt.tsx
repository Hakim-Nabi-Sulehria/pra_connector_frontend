import { useState } from 'react';
import { api } from '../lib/api';

export function QboConnectPrompt({
  companyName,
  returnPath,
  authUrlPath,
}: {
  companyName?: string;
  returnPath: string;
  authUrlPath: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  return (
    <div className="card qbo-connect-card">
      <div className="identity-kicker">QuickBooks Online</div>
      <h2 style={{ marginTop: 4 }}>Connect your QuickBooks company</h2>
      <p>
        {companyName ? <strong>{companyName}</strong> : 'This workspace'} needs a QuickBooks Online
        connection before invoices can be fetched, mapped, or posted.
      </p>
      {err && <div className="error-box">{err}</div>}
      <button
        className="btn btn-primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr('');
          try {
            const returnOrigin = encodeURIComponent(window.location.origin);
            const path = encodeURIComponent(returnPath);
            const { url } = await api<{ url: string }>(
              `${authUrlPath}?returnOrigin=${returnOrigin}&returnPath=${path}`,
            );
            window.location.href = url;
          } catch (e: any) {
            setErr(e.message || 'Could not start QuickBooks connect');
            setBusy(false);
          }
        }}
      >
        {busy ? 'Opening QuickBooks…' : 'Connect QuickBooks Online'}
      </button>
      <p className="map-hint" style={{ marginTop: 12, marginBottom: 0 }}>
        After Intuit authorizes the app, you will return here and the dashboard will load live
        invoices.
      </p>
    </div>
  );
}
