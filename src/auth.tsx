import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  ApiError,
  clearSession,
  getIntegrationMode,
  getPortal,
  getToken,
  setIntegrationMode,
  setSession,
  type IntegrationMode,
  type Portal,
} from './lib/api';

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'CUSTOMER_ADMIN' | 'CUSTOMER_USER';
  integrationMode?: IntegrationMode;
  organizationId?: string | null;
  organization?: any;
};

type AuthState = {
  user: User | null;
  portal: Portal | null;
  integrationMode: IntegrationMode;
  loading: boolean;
  login: (
    portal: Portal,
    email: string,
    password: string,
    integrationMode: IntegrationMode,
    captcha?: string,
  ) => Promise<User>;
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    organizationName: string;
    pntn?: string;
    integrationMode?: IntegrationMode;
  }) => Promise<User>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [portal, setPortal] = useState<Portal | null>(getPortal());
  const [integrationMode, setMode] = useState<IntegrationMode>(getIntegrationMode());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<User>('/auth/me');
      setUser(me);
      setPortal(getPortal());
      const mode = me.integrationMode || getIntegrationMode();
      setMode(mode);
      setIntegrationMode(mode);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        clearSession();
        setUser(null);
        setPortal(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (
      p: Portal,
      email: string,
      password: string,
      mode: IntegrationMode,
      captcha?: string,
    ) => {
      clearSession();
      setUser(null);
      const path = p === 'admin' ? '/auth/admin/login' : '/auth/customer/login';
      const res = await api<{ accessToken: string; user: User }>(path, {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          integrationMode: mode,
          ...(p === 'customer' ? { captcha } : {}),
        }),
      });
      setSession(res.accessToken, p, mode);
      setPortal(p);
      setMode(mode);
      setIntegrationMode(mode);
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const register = useCallback(async (payload: any) => {
    const mode: IntegrationMode = payload.integrationMode || 'PRA';
    const res = await api<{ accessToken: string; user: User }>('/auth/customer/register', {
      method: 'POST',
      body: JSON.stringify({ ...payload, integrationMode: mode }),
    });
    setSession(res.accessToken, 'customer', mode);
    setPortal('customer');
    setMode(mode);
    setIntegrationMode(mode);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setPortal(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      portal,
      integrationMode,
      loading,
      login,
      register,
      logout,
      refresh,
    }),
    [user, portal, integrationMode, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside provider');
  return ctx;
}
