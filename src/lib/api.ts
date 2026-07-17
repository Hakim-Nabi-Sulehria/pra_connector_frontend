const TOKEN_KEY = 'pra_connector_token';
const PORTAL_KEY = 'pra_connector_portal';

export type Portal = 'admin' | 'customer';

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
