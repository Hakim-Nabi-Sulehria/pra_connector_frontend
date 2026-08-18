import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { getIntegrationMode, getToken, setSession } from '../lib/api';
import { peekQboResume, safeClientReturnPath, takeQboResume } from '../lib/qbo-oauth';

export function OAuthQboResumePage() {
  const { refresh } = useAuth();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Finishing QuickBooks connection…');

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      const resume = peekQboResume();
      if (resume?.token && !getToken()) {
        setSession(resume.token, resume.portal || 'customer', resume.mode || 'FBR');
      }

      setStatus('Restoring your workspace…');
      const me = await refresh();
      if (cancelled) return;

      const qbo = search.get('qbo') || 'connected';
      const message = search.get('message') || '';
      const mode = me?.integrationMode || resume?.mode || getIntegrationMode();
      const next = safeClientReturnPath(search.get('next') || resume?.returnPath, mode);
      const qs = new URLSearchParams({ qbo });
      if (message) qs.set('message', message);

      takeQboResume();
      if (me) {
        navigate(`${next}?${qs.toString()}`, { replace: true });
        return;
      }
      navigate(`/login?${qs.toString()}`, { replace: true });
    }

    finish().catch(() => {
      if (!cancelled) navigate('/login', { replace: true });
    });

    return () => {
      cancelled = true;
    };
  }, [navigate, refresh, search]);

  return (
    <div className="oauth-resume">
      <div className="oauth-resume-card">
        <div className="oauth-resume-mark">QBO</div>
        <h1>Connecting QuickBooks</h1>
        <p>{status}</p>
      </div>
    </div>
  );
}
