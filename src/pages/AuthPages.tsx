import { type FormEvent, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import { api, type IntegrationMode } from '../lib/api';
import { IntegrationModeLoginTabs } from '../components/IntegrationModeTabs';

export function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="brand-mark" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          QuickBooks Online <span style={{ color: 'var(--teal)' }}>Connector</span>
        </div>
        <div className="landing-actions">
          <Link className="btn btn-ghost" to="/login">
            Customer login
          </Link>
          <Link className="btn btn-primary" to="/admin/login">
            Super Admin
          </Link>
        </div>
      </nav>
      <section className="landing-hero">
        <h1>
          Fiscal sync that <em>runs itself</em>
        </h1>
          <p>
          Connect QuickBooks Online once. Run <strong>PRA</strong> fiscal posting and
          <strong> FBR</strong> digital invoicing in one platform — two isolated workspaces, never mixed.
        </p>
        <div className="landing-actions">
          <Link className="btn btn-primary" to="/register">
            Start onboarding
          </Link>
          <Link className="btn btn-ghost" to="/login">
            Open workspace
          </Link>
        </div>
        <p className="map-hint" style={{ marginTop: 12 }}>
          On login, choose the <strong>PRA</strong> or <strong>FBR</strong> tab. Test users are
          isolated: <code>pratestuser@qboconnector.com</code> (PRA) and{' '}
          <code>fbrtestuser@qboconnector.com</code> (FBR).
        </p>
        <p className="legal-links">
          <Link to="/terms">Terms</Link> · <Link to="/privacy">Privacy</Link>
        </p>
      </section>
    </div>
  );
}

function AuthShell({
  title,
  hint,
  children,
  visualTitle,
  visualBody,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
  visualTitle: string;
  visualBody: string;
}) {
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div>
          <div style={{ opacity: 0.7, marginBottom: 18, fontWeight: 700 }}>
            QuickBooks Online Connector
          </div>
          <h1>{visualTitle}</h1>
          <p>{visualBody}</p>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <h2>{title}</h2>
          <p className="hint">{hint}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AdminLoginPage() {
  const { login, user, portal, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@praconnector.com');
  const [password, setPassword] = useState('Admin@12345');
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
      title="Super Admin access"
      hint="One login for the platform. Switch PRA and FBR inside the control plane."
      visualTitle="Operate the network"
      visualBody="Monitor every tenant connection, fiscal post success rate, and integration health from one command surface."
    >
      <form onSubmit={onSubmit}>
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </div>
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Signing in…' : 'Enter admin portal'}
        </button>
        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--muted)' }}>
          Customer? <Link to="/login">Go to workspace login</Link>
        </p>
      </form>
    </AuthShell>
  );
}

export function CustomerLoginPage() {
  const { login, user, portal, integrationMode, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<IntegrationMode>('PRA');
  const [email, setEmail] = useState('pratestuser@qboconnector.com');
  const [password, setPassword] = useState('Pratest@12345');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState(() => {
    const a = Math.floor(Math.random() * 8) + 1;
    const b = Math.floor(Math.random() * 8) + 1;
    return { a, b };
  });
  const [captchaInput, setCaptchaInput] = useState('');
  const captchaOk = captchaInput.trim() === String(captcha.a + captcha.b);

  if (!loading && user && portal === 'customer' && integrationMode === mode) {
    return <Navigate to={mode === 'FBR' ? '/fbr/app' : '/app'} replace />;
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
      title="Customer workspace"
      hint={
        mode === 'FBR'
          ? 'Connect QuickBooks, configure FBR DI, validate and post invoices.'
          : 'Connect QuickBooks, configure PRA, and watch invoices fiscalize.'
      }
      visualTitle="Set it once"
      visualBody={
        mode === 'FBR'
          ? 'Onboard your company, wire QBO + FBR DI API, validate then post for FBR invoice numbers.'
          : 'Onboard your company, wire QBO + PRA, then let the integration service own retries, logs, and compliance traffic.'
      }
    >
      <IntegrationModeLoginTabs
        mode={mode}
        onChange={(next) => {
          setMode(next);
          if (next === 'FBR') {
            setEmail('fbrtestuser@qboconnector.com');
            setPassword('Fbrtest@12345');
          } else {
            setEmail('pratestuser@qboconnector.com');
            setPassword('Pratest@12345');
          }
        }}
      />
      <form onSubmit={onSubmit}>
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Work email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
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
          {busy ? 'Signing in…' : 'Open workspace'}
        </button>
        <button
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 10 }}
          type="button"
          disabled={busy}
          onClick={() => navigate('/reset-password')}
        >
          Reset password
        </button>
        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--muted)' }}>
          New org? <Link to="/register">Create account</Link>
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
      title="Create your organization"
      hint={
        mode === 'FBR'
          ? 'Spin up an FBR tenant workspace for DI validate/post.'
          : 'Spin up a PRA tenant workspace with default field mappings.'
      }
      visualTitle="Onboard in minutes"
      visualBody={
        mode === 'FBR'
          ? 'Your company gets FBR seller profile slots and QBO connection — ready for DI sandbox testing.'
          : 'Your company gets branches, mapping presets, and connection slots for QuickBooks and PRA — ready for go-live.'
      }
    >
      <IntegrationModeLoginTabs mode={mode} onChange={setMode} />
      <form onSubmit={onSubmit}>
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
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Creating…' : 'Create workspace'}
        </button>
        <p style={{ marginTop: 14, fontSize: 13, color: 'var(--muted)' }}>
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
      hint="Enter your email and we will generate an OTP."
      visualTitle="Secure reset"
      visualBody="OTP verification protects your account from unauthorized password changes."
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
      hint="We generated an OTP for password reset."
      visualTitle="OTP check"
      visualBody="Confirm your OTP to unlock the password update form."
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
          {debugOtp ? (
            <p className="field-hint">Debug OTP (test): {debugOtp}</p>
          ) : null}
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
      visualTitle="Password update"
      visualBody="Choose a strong password and confirm it."
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
