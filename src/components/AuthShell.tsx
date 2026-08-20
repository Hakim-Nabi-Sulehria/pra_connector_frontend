import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Lock, ShieldCheck, Zap } from 'lucide-react';
import tmrcLogo from '../assets/branding/tmrc-logo.png';
import tmracLogo from '../assets/branding/tmrac-logo.png';
import tmrDiLogo from '../assets/branding/tmr-di-logo.png';
import fbrLogo from '../assets/branding/fbr-logo.png';
import plraLogo from '../assets/branding/plra-logo.png';
import authHero from '../assets/branding/auth-hero-illustration.png';
import invoiceHero from '../assets/branding/invoice-hero.png';

type AuthShellProps = {
  title: string;
  hint: string;
  children: ReactNode;
  visualTitle: string;
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
  visualTitle,
  visualBody,
  variant = 'pra',
  footer,
}: AuthShellProps) {
  return (
    <div className={`premium-auth${variant === 'fbr' ? ' premium-auth-fbr' : ''}${variant === 'admin' ? ' premium-auth-admin' : ''}`}>
      <aside className="premium-auth-showcase">
        <div className="premium-auth-showcase-bg" aria-hidden="true">
          <span className="premium-auth-orb premium-auth-orb-a" />
          <span className="premium-auth-orb premium-auth-orb-b" />
          <span className="premium-auth-grid" />
        </div>

        <div className="premium-auth-showcase-inner">
          <motion.div
            className="premium-auth-brand-stack"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <img src={tmrDiLogo} alt="TMR DI Software" className="premium-auth-product-logo" />
            <div className="premium-auth-product-copy">
              <span className="premium-auth-kicker">QuickBooks Online Connector</span>
              <h1>{visualTitle}</h1>
              <p>{visualBody}</p>
            </div>
          </motion.div>

          <motion.div
            className="premium-auth-visual-stage"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.08 }}
          >
            <img src={authHero} alt="" className="premium-auth-hero-illustration" />
            <img src={invoiceHero} alt="" className="premium-auth-invoice-float" />
          </motion.div>

          <motion.ul
            className="premium-auth-features"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {features.map((item) => (
              <li key={item.label}>
                <item.icon size={15} />
                {item.label}
              </li>
            ))}
          </motion.ul>

          <motion.div
            className="premium-auth-compliance"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.22 }}
          >
            <img src={plraLogo} alt="PLRA" />
            <img src={fbrLogo} alt="FBR Pakistan" />
          </motion.div>

          <div className="premium-auth-partners">
            <span>A product by</span>
            <div className="premium-auth-partner-logos">
              <img src={tmrcLogo} alt="TMR Consulting" />
              <span className="premium-auth-partner-divider" />
              <img src={tmracLogo} alt="TMRAC" />
            </div>
          </div>
        </div>
      </aside>

      <main className="premium-auth-main">
        <motion.div
          className="premium-auth-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <div className="premium-auth-card-head">
            <div className="premium-auth-card-badge">
              <CheckCircle2 size={14} />
              {variant === 'admin' ? 'Super Admin' : 'Secure sign in'}
            </div>
            <h2>{title}</h2>
            <p>{hint}</p>
          </div>

          {children}

          {footer}

          <div className="premium-auth-card-partners">
            <img src={tmrcLogo} alt="TMR Consulting" />
            <img src={tmracLogo} alt="TMRAC" />
          </div>

          <p className="premium-auth-legal">
            <Link to="/terms">Terms</Link>
            <span>·</span>
            <Link to="/privacy">Privacy</Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
