import { api, getIntegrationMode, getPortal, getToken, type IntegrationMode, type Portal } from './api';

const RESUME_KEY = 'qbo_oauth_resume';

export type QboResume = {
  token: string | null;
  portal: Portal | null;
  mode: IntegrationMode;
  returnPath: string;
  t: number;
};

export function rememberQboResume(returnPath: string) {
  const payload: QboResume = {
    token: getToken(),
    portal: getPortal(),
    mode: getIntegrationMode(),
    returnPath,
    t: Date.now(),
  };
  sessionStorage.setItem(RESUME_KEY, JSON.stringify(payload));
}

export function peekQboResume(): QboResume | null {
  try {
    const raw = sessionStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QboResume;
  } catch {
    return null;
  }
}

export function takeQboResume(): QboResume | null {
  const resume = peekQboResume();
  sessionStorage.removeItem(RESUME_KEY);
  return resume;
}

export function safeClientReturnPath(path?: string | null, mode?: IntegrationMode | null) {
  const raw = String(path || '').split('?')[0];
  if (raw.startsWith('/fbr/app')) return raw;
  if (raw.startsWith('/app')) return raw;
  return mode === 'FBR' ? '/fbr/app/connections' : '/app/connections';
}

const FLASH_KEY = 'qbo_oauth_flash';

export function setQboFlash(qbo: string, message?: string) {
  sessionStorage.setItem(
    FLASH_KEY,
    JSON.stringify({ qbo, message: message || '', t: Date.now() }),
  );
}

export function takeQboFlash(): { qbo: string; message: string } | null {
  try {
    const raw = sessionStorage.getItem(FLASH_KEY);
    sessionStorage.removeItem(FLASH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { qbo: String(parsed.qbo || ''), message: String(parsed.message || '') };
  } catch {
    sessionStorage.removeItem(FLASH_KEY);
    return null;
  }
}

export async function startQboOAuth(authUrlPath: string, returnPath: string) {
  rememberQboResume(returnPath);
  const qs = new URLSearchParams({
    returnOrigin: window.location.origin,
    returnPath,
    mode: getIntegrationMode(),
  });
  const { url } = await api<{ url: string }>(`${authUrlPath}?${qs.toString()}`);
  window.location.assign(url);
}
