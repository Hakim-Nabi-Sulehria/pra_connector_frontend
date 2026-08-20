import { type FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { api, type IntegrationMode } from '../lib/api';
import { IntegrationModeLoginTabs } from '../components/IntegrationModeTabs';
import { AuthShell } from '../components/AuthShell';
import tmrcLogo from '../assets/branding/tmrc-latest-logo.png';
import tmracLogo from '../assets/branding/TMRAC_latest_logo.jpeg';
import tmrDiLogo from '../assets/branding/tmr-di-software-logo.png';

export function LandingPage() {
  return (
    <div className="landing premium-landing">
      <nav className="landing-nav premium-landing-nav">
        <img src={tmrDiLogo} alt="TMR DI Software" className="premium-landing-logo" />
        <div className="landing-actions">
          <Link className="btn btn-ghost" to="/login">
            Sign in
          </Link>
          <Link className="btn btn-primary" to="/admin/login">
            Super Admin
          </Link>
        </div>
      </nav>
      <section className="landing-hero premium-landing-hero">
        <div className="premium-landing-kicker">QuickBooks Online Connector</div>
        <h1>
          Smart invoicing for <em>PRA & FBR</em>
        </h1>
        <p>
          Connect QuickBooks Online, configure fiscal mappings, and post compliant invoices with
          confidence.
        </p>
        <div className="landing-actions">
          <Link className="btn btn-primary" to="/login">
            Sign in to workspace
          </Link>
          <Link className="btn btn-ghost" to="/register">
            Create account
          </Link>
        </div>
        <div className="premium-landing-partners">
          <img src={tmrcLogo} alt="TMR Consulting" />
          <img src={tmracLogo} alt="TMRAC" />
        </div>
        <p className="legal-links">
          <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link>
        </p>
      </section>
    </div>
  );
}


export function AdminLoginPage() {  const { login, user, portal, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user && portal === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login('admin', email, password, 'PRA');
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      variant="admin"
      title="Super Admin access"
      hint="Sign in to manage companies, connections, and platform settings."
      visualBody="Oversee companies, QuickBooks connections, and fiscal integrations from one secure admin portal."
    >
      <form className="premium-auth-form" onSubmit={onSubmit}>
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="admin@company.com"
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Enter your password"
            required
          />
        </div>
        <button className="btn btn-primary premium-auth-submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Enter admin portal'}
        </button>
        <p className="premium-auth-switch">
          Customer workspace? <Link to="/login">Go to sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function CustomerLoginPage() {
  const { login, user, portal, integrationMode, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<IntegrationMode>('FBR');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState(() => {
    const a = Math.floor(Math.random() * 8) + 1;
    const b = Math.floor(Math.random() * 8) + 1;
    return { a, b };
  });
  const [captchaInput, setCaptchaInput] = useState('');
  const captchaOk = captchaInput.trim() === String(captcha.a + captcha.b);

  if (!loading && user && portal === 'customer') {
    return <Navigate to={integrationMode === 'FBR' ? '/fbr/app' : '/app'} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!captchaOk) {
      setError('Please solve the captcha to continue.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login('customer', email, password, mode, captchaInput);
      navigate(mode === 'FBR' ? '/fbr/app' : '/app');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      variant={mode === 'FBR' ? 'fbr' : 'pra'}
      title="Welcome back"
      hint="Sign in to your workspace and continue fiscal invoicing."
      visualBody={
        mode === 'FBR'
          ? 'Connect QuickBooks Online and post compliant invoices to FBR in real time.'
          : 'Connect QuickBooks Online and post compliant invoices to PRA in real time.'
      }
    >
      <IntegrationModeLoginTabs
        mode={mode}
        onChange={(next) => {
          setMode(next);
          setEmail('');
          setPassword('');
        }}
      />
      <form className="premium-auth-form" onSubmit={onSubmit}>
        {searchParams.get('qbo') === 'connected' && (
          <div className="card flash-ok" style={{ marginBottom: 14 }}>
            QuickBooks was approved. Sign in to open your workspace.
          </div>
        )}
        {searchParams.get('qbo') === 'error' && (
          <div className="error-box">
            {searchParams.get('message') || 'QuickBooks connection failed'}
          </div>
        )}
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Work email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@company.com"
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Enter your password"
            required
          />
        </div>
        <div className="field">
          <label>Captcha</label>
          <div className="premium-auth-captcha">
            <span className="premium-auth-captcha-chip">
              {captcha.a} + {captcha.b} = ?
            </span>
            <input
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              placeholder="Answer"
              required
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                const a = Math.floor(Math.random() * 8) + 1;
                const b = Math.floor(Math.random() * 8) + 1;
                setCaptcha({ a, b });
                setCaptchaInput('');
              }}
            >
              Refresh
            </button>
          </div>
        </div>
        <button className="btn btn-primary premium-auth-submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in to workspace'}
        </button>
        <button
          className="btn btn-ghost premium-auth-secondary"
          type="button"
          disabled={busy}
          onClick={() => navigate('/reset-password')}
        >
          Reset password
        </button>
        <p className="premium-auth-switch">
          New organization? <Link to="/register">Create account</Link>
          {' · '}
          <Link to="/admin/login">Super Admin</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function FbrAdminLoginPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/admin/login', { replace: true });
  }, [navigate]);
  return null;
}

export function FbrCustomerLoginPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/login', { replace: true });
  }, [navigate]);
  return null;
}

export function RegisterPage() {
  const { register, user, portal, integrationMode, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<IntegrationMode>('PRA');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    organizationName: '',
    pntn: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user && portal === 'customer') {
    return <Navigate to={integrationMode === 'FBR' ? '/fbr/app' : '/app'} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register({ ...form, integrationMode: mode });
      navigate(mode === 'FBR' ? '/fbr/app' : '/app');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      variant={mode === 'FBR' ? 'fbr' : 'pra'}
      title="Create your workspace"
      hint="Register your organization and start fiscal invoicing."
      visualBody={
        mode === 'FBR'
          ? 'Connect QuickBooks Online and post compliant invoices to FBR in real time.'
          : 'Connect QuickBooks Online and post compliant invoices to PRA in real time.'
      }
    >
      <IntegrationModeLoginTabs mode={mode} onChange={setMode} />
      <form className="premium-auth-form" onSubmit={onSubmit}>
        {error && <div className="error-box">{error}</div>}
        {(
          [
            ['fullName', 'Your name'],
            ['organizationName', 'Company name'],
            ['pntn', 'PNTN (optional)'],
            ['email', 'Email'],
            ['password', 'Password'],
          ] as const
        ).map(([key, label]) => (
          <div className="field" key={key}>
            <label>{label}</label>
            <input
              type={key === 'password' ? 'password' : key === 'email' ? 'email' : 'text'}
              value={(form as any)[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              required={key !== 'pntn'}
            />
          </div>
        ))}
        <button className="btn btn-primary premium-auth-submit" disabled={busy}>
          {busy ? 'Creating…' : 'Create workspace'}
        </button>
        <p className="premium-auth-switch">
          Already onboarded? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordRequestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [captcha, setCaptcha] = useState(() => {
    const a = Math.floor(Math.random() * 8) + 1;
    const b = Math.floor(Math.random() * 8) + 1;
    return { a, b };
  });
  const [captchaInput, setCaptchaInput] = useState('');
  const captchaOk = captchaInput.trim() === String(captcha.a + captcha.b);

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!captchaOk) {
      setError('Please solve captcha.');
      return;
    }
    setBusy(true);
    try {
      const res = await api<{ ok: boolean; otp: string }>(
        '/auth/customer/request-password-reset',
        {
          method: 'POST',
          body: JSON.stringify({ email, captcha: captchaInput }),
        },
      );
      sessionStorage.setItem('resetOtpEmail', email.toLowerCase());
      sessionStorage.setItem('resetOtp', res.otp);
      navigate(`/reset-password/otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Reset password"
      hint="Enter your email to receive an OTP."
      visualBody="Connect QuickBooks Online and post compliant invoices in real time."
    >
      <form onSubmit={sendOtp}>
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div className="field">
          <label>Captcha</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge" style={{ fontFamily: 'ui-monospace, monospace' }}>
              {captcha.a} + {captcha.b} = ?
            </span>
            <input
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              placeholder="Enter answer"
              style={{ width: 180 }}
              required
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                const a = Math.floor(Math.random() * 8) + 1;
                const b = Math.floor(Math.random() * 8) + 1;
                setCaptcha({ a, b });
                setCaptchaInput('');
              }}
            >
              Refresh captcha
            </button>
          </div>
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Sending OTP…' : 'Send OTP'}
        </button>
        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--muted)' }}>
          Back to login? <Link to="/login">Go to login</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [email] = useState(initialEmail);
  const [otp, setOtp] = useState(() => sessionStorage.getItem('resetOtp') || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const debugOtp = sessionStorage.getItem('resetOtp');
  useEffect(() => {
    if (!otp && debugOtp) setOtp(debugOtp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debugOtp]);

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/auth/customer/verify-password-reset-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      navigate(`/reset-password/update?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Enter OTP"
      hint="Enter the OTP sent to your email."
      visualBody="Connect QuickBooks Online and post compliant invoices in real time."
    >
      <form onSubmit={verify}>
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input value={email} disabled />
        </div>
        <div className="field">
          <label>OTP</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            required
          />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Verifying…' : 'Verify OTP'}
        </button>
        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--muted)' }}>
          Need new OTP?{' '}
          <Link to={`/reset-password?email=${encodeURIComponent(email)}`}>Resend</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function ResetPasswordUpdatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [email] = useState(initialEmail);

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const otp = sessionStorage.getItem('resetOtp') || '';

  async function update(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!otp) {
      setError('OTP missing. Please request a new OTP.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await api('/auth/customer/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
      });
      sessionStorage.removeItem('resetOtp');
      sessionStorage.removeItem('resetOtpEmail');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Update password"
      hint="Set a new password for your workspace account."
      visualBody="Connect QuickBooks Online and post compliant invoices in real time."
    >
      <form onSubmit={update}>
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input value={email} disabled />
        </div>
        <div className="field">
          <label>Enter new password</label>
          <input
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
            required
          />
        </div>
        <div className="field">
          <label>Confirm password</label>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type="password"
            required
          />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Updating…' : 'Update password'}
        </button>
        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--muted)' }}>
          Back to login? <Link to="/login">Go to login</Link>
        </p>
      </form>
    </AuthShell>
  );
}
