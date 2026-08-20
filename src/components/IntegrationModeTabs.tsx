import { NavLink } from 'react-router-dom';
import { setIntegrationMode, type IntegrationMode } from '../lib/api';
import { useAuth } from '../auth';

type Props = {
  mode: IntegrationMode;
  admin?: boolean;
};

export function IntegrationModeTabs({ mode, admin }: Props) {
  const { switchMode } = useAuth();
  const praPath = admin ? '/admin' : '/login';
  const fbrPath = admin ? '/admin/fbr' : '/login';
  const adminTabStyle = (active: boolean) =>
    admin
      ? {
          flex: 1,
          textAlign: 'center' as const,
          borderColor: active ? 'rgba(20,184,166,0.42)' : 'rgba(255,255,255,0.18)',
          background: active ? 'rgba(20,184,166,0.18)' : 'rgba(255,255,255,0.06)',
          color: '#fff',
          fontWeight: 700,
        }
      : { flex: 1, textAlign: 'center' as const };

  return (
    <div className="mode-tabs" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <NavLink
        to={praPath}
        end={admin}
        className={`btn ${mode === 'PRA' ? 'btn-primary' : 'btn-ghost'}`}
        style={adminTabStyle(mode === 'PRA')}
        onClick={() => {
          setIntegrationMode('PRA');
          switchMode?.('PRA');
        }}
      >
        PRA
      </NavLink>
      <NavLink
        to={fbrPath}
        end={admin}
        className={`btn ${mode === 'FBR' ? 'btn-primary' : 'btn-ghost'}`}
        style={adminTabStyle(mode === 'FBR')}
        onClick={() => {
          setIntegrationMode('FBR');
          switchMode?.('FBR');
        }}
      >
        FBR
      </NavLink>
    </div>
  );
}

export function IntegrationModeLoginTabs({
  mode,
  onChange,
}: {
  mode: IntegrationMode;
  onChange: (m: IntegrationMode) => void;
}) {
  return (
    <div className="premium-auth-mode-tabs">
      <button
        type="button"
        className={mode === 'PRA' ? 'active' : ''}
        onClick={() => onChange('PRA')}
      >
        PRA
      </button>
      <button
        type="button"
        className={mode === 'FBR' ? 'active' : ''}
        onClick={() => onChange('FBR')}
      >
        FBR
      </button>
    </div>
  );
}
