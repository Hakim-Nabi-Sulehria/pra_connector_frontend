const TOKEN_KEY = 'pra_connector_token';
const PORTAL_KEY = 'pra_connector_portal';

export type Portal = 'admin' | 'customer';

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://pra-connector-backend.onrender.com' : '')
).replace(/\/$/, '');

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, portal: Portal) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PORTAL_KEY, portal);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PORTAL_KEY);
}

export function getPortal(): Portal | null {
  return (localStorage.getItem(PORTAL_KEY) as Portal) || null;
}

export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || data.error || 'Request failed';
    throw new Error(msg);
  }
  return data as T;
}
