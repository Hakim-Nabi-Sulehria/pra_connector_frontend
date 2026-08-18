const TOKEN_KEY = 'pra_connector_token';
const PORTAL_KEY = 'pra_connector_portal';
const MODE_KEY = 'pra_connector_mode';

export type Portal = 'admin' | 'customer';
export type IntegrationMode = 'PRA' | 'FBR';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Production API (Render). Override with VITE_API_URL if needed. */
const DEFAULT_PROD_API = 'https://pra-connector-backend.onrender.com';

/** Dev uses Vite proxy (empty base). Prod calls Render directly — CORS allows *.vercel.app. */
const API_BASE = (
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ||
  (import.meta.env.DEV ? '' : DEFAULT_PROD_API)
);

function readStore(key: string) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

export function getToken() {
  return readStore(TOKEN_KEY);
}

export function setSession(token: string, portal: Portal, mode: IntegrationMode = 'PRA') {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PORTAL_KEY, portal);
  localStorage.setItem(MODE_KEY, mode);
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(PORTAL_KEY, portal);
  sessionStorage.setItem(MODE_KEY, mode);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PORTAL_KEY);
  localStorage.removeItem(MODE_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(PORTAL_KEY);
  sessionStorage.removeItem(MODE_KEY);
  sessionStorage.removeItem('qbo_oauth_resume');
}

export function getPortal(): Portal | null {
  return (readStore(PORTAL_KEY) as Portal) || null;
}

export function getIntegrationMode(): IntegrationMode {
  return (readStore(MODE_KEY) as IntegrationMode) || 'PRA';
}

export function setIntegrationMode(mode: IntegrationMode) {
  localStorage.setItem(MODE_KEY, mode);
  sessionStorage.setItem(MODE_KEY, mode);
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 2) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new ApiError('Cannot reach the API server. Wait a moment and try again.');
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
  const mode = getIntegrationMode();
  if (mode) headers['X-Integration-Mode'] = mode;

  const url = `${API_BASE}/api${path}`;
  const res = await fetchWithRetry(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || data.error || `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}
