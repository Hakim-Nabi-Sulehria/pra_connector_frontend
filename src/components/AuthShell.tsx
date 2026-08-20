import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ShieldCheck, Zap } from 'lucide-react';
import tmrcLogo from '../assets/branding/tmrc-latest-logo.png';
import tmracLogo from '../assets/branding/TMRAC_latest_logo.jpeg';
import authHero from '../assets/branding/auth-hero-illustration.png';
import invoiceHero from '../assets/branding/dummyinvoicepic.png';

type AuthShellProps = {
  title: string;
  hint: string;
  children: ReactNode;
  visualBody: string;
  variant?: 'pra' | 'fbr' | 'admin';
  footer?: ReactNode;
};

const features = [
  { icon: Zap, label: 'Real-time QBO sync' },
  { icon: ShieldCheck, label: 'PRA & FBR compliant' },
  { icon: Lock, label: 'Secure fiscal posting' },
];

export function AuthShell({
  title,
  hint,
  children,
  visualBody,
  variant = 'pra',
  footer,
}: AuthShellProps) {
  return (
    <div className={`auth-screen${variant === 'fbr' ? ' auth-screen-fbr' : ''}${variant === 'admin' ? ' auth-screen-admin' : ''}`}>
      <section className="auth-screen-visual" aria-hidden="false">
        <img src={tmrcLogo} alt="TMR Consulting" className="auth-screen-tmrc" />

        <div className="auth-screen-copy">
          <p>{visualBody}</p>
        </div>

        <div className="auth-screen-art">
          <img src={authHero} alt="" className="auth-screen-hero" />
          <img src={invoiceHero} alt="" className="auth-screen-invoice" />
        </div>

        <ul className="auth-screen-features">
          {features.map((item) => (
            <li key={item.label}>
              <item.icon size={12} />
              {item.label}
            </li>
          ))}
        </ul>

        <img src={tmracLogo} alt="TMRAC" className="auth-screen-tmrac" />
      </section>

      <section className="auth-screen-panel">
        <div className="auth-screen-card">
          <div className="auth-screen-card-head">
            <h2>{title}</h2>
            <p>{hint}</p>
          </div>

          {children}
          {footer}

          <p className="auth-screen-legal">
            <Link to="/terms">Terms</Link>
            <span>·</span>
            <Link to="/privacy">Privacy</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
