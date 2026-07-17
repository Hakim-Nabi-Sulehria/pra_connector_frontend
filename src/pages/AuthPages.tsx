import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export function LandingPage() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="brand-mark" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          PRA <span style={{ color: 'var(--teal)' }}>Connector</span>
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
          Connect QuickBooks Online once, map PRA fields, and let the background engine post,
          retry, and audit every invoice — without spreadsheet babysitting.
        </p>
        <div className="landing-actions">
          <Link className="btn btn-primary" to="/register">
            Start onboarding
          </Link>
          <Link className="btn btn-ghost" to="/login">
            Enter workspace
          </Link>
        </div>
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
          <div style={{ opacity: 0.7, marginBottom: 18, fontWeight: 700 }}>PRA Connector</div>
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
  // Matches backend .env seed defaults (SUPER_ADMIN_PASSWORD)
  const [password, setPassword] = useState('change-me');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user && portal === 'admin') return <Navigate to="/admin" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login('admin', email, password);
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
      hint="Platform control plane — organizations, traffic, and audit."
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
  const { login, user, portal, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@fenzi.com');
  // Matches backend .env seed defaults (DEMO_CUSTOMER_PASSWORD)
  const [password, setPassword] = useState('change-me');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user && portal === 'customer') return <Navigate to="/app" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login('customer', email, password);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Customer workspace"
      hint="Connect QuickBooks, configure PRA, and watch invoices fiscalize."
      visualTitle="Set it once"
      visualBody="Onboard your company, wire QBO + PRA, then let the integration service own retries, logs, and compliance traffic."
    >
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
        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
          {busy ? 'Signing in…' : 'Open workspace'}
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

export function RegisterPage() {
  const { register, user, portal, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    organizationName: '',
    pntn: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user && portal === 'customer') return <Navigate to="/app" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate('/app');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create your organization"
      hint="Spin up a tenant workspace with default PRA field mappings."
      visualTitle="Onboard in minutes"
      visualBody="Your company gets branches, mapping presets, and connection slots for QuickBooks and PRA — ready for go-live."
    >
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
