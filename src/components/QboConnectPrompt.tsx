import { useState } from 'react';
import { Plug } from 'lucide-react';
import { startQboOAuth } from '../lib/qbo-oauth';

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
      <div className="identity-kicker">
        <Plug size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
        QuickBooks Online
      </div>
      <h2 style={{ marginTop: 4 }}>Connect QuickBooks</h2>
      <p>
        {companyName ? <strong>{companyName}</strong> : 'This workspace'} is not connected to QuickBooks.
      </p>
      {err && <div className="error-box">{err}</div>}
      <button
        className="btn btn-primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr('');
          try {
            await startQboOAuth(authUrlPath, returnPath);
          } catch (e: any) {
            setErr(e.message || 'Could not start QuickBooks connect');
            setBusy(false);
          }
        }}
      >
        {busy ? 'Opening QuickBooks…' : 'Connect QuickBooks'}
      </button>
    </div>
  );
}
