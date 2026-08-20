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

  return (
    <div className={`mode-tabs portal-mode-tabs${admin ? ' portal-mode-tabs-admin' : ''}`}>
      <NavLink
        to={praPath}
        end={admin}
        className={`mode-tab${mode === 'PRA' ? ' active' : ''}`}
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
        className={`mode-tab${mode === 'FBR' ? ' active' : ''}`}
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
    <div className="premium-auth-mode-tabs auth-screen-mode-tabs portal-mode-tabs">
      <button
        type="button"
        className={`mode-tab${mode === 'PRA' ? ' active' : ''}`}
        onClick={() => onChange('PRA')}
      >
        PRA
      </button>
      <button
        type="button"
        className={`mode-tab${mode === 'FBR' ? ' active' : ''}`}
        onClick={() => onChange('FBR')}
      >
        FBR
      </button>
    </div>
  );
}
