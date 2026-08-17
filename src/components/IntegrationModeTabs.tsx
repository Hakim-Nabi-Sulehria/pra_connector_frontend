import { NavLink } from 'react-router-dom';
import type { IntegrationMode } from '../lib/api';

type Props = {
  mode: IntegrationMode;
  admin?: boolean;
};

export function IntegrationModeTabs({ mode, admin }: Props) {
  const praPath = admin ? '/admin' : '/login';
  const fbrPath = admin ? '/admin/fbr' : '/fbr/login';

  return (
    <div className="mode-tabs" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <NavLink
        to={praPath}
        end={admin}
        className={`btn ${mode === 'PRA' ? 'btn-primary' : 'btn-ghost'}`}
        style={{ flex: 1, textAlign: 'center' }}
      >
        PRA
      </NavLink>
      <NavLink
        to={fbrPath}
        end={admin}
        className={`btn ${mode === 'FBR' ? 'btn-primary' : 'btn-ghost'}`}
        style={{ flex: 1, textAlign: 'center' }}
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
    <div className="mode-tabs" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      <button
        type="button"
        className={`btn ${mode === 'PRA' ? 'btn-primary' : 'btn-ghost'}`}
        style={{ flex: 1 }}
        onClick={() => onChange('PRA')}
      >
        PRA
      </button>
      <button
        type="button"
        className={`btn ${mode === 'FBR' ? 'btn-primary' : 'btn-ghost'}`}
        style={{ flex: 1 }}
        onClick={() => onChange('FBR')}
      >
        FBR
      </button>
    </div>
  );
}
