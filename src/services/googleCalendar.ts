const MAPPING_KEY = 'gcal_event_map';
const TOKEN_KEY = 'gcal_token_data';
const CLIENT_ID = '475964112001-5jrj7de92hkklfb23qmgsskdapaoqin5.apps.googleusercontent.com';

interface TokenData {
  accessToken: string;
  expiresAt: number;
}

function getMapping(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(MAPPING_KEY) || '{}');
  } catch { return {}; }
}

function saveMapping(m: Record<string, string>) {
  localStorage.setItem(MAPPING_KEY, JSON.stringify(m));
}

function getTokenData(): TokenData | null {
  try {
    return JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
  } catch { return null; }
}

function saveTokenData(t: TokenData) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
}

function clearTokenData() {
  localStorage.removeItem(TOKEN_KEY);
}

let tokenClient: google.accounts.oauth2.TokenClient | null = null;

function loadGis(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof google !== 'undefined' && google.accounts?.oauth2) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.head.appendChild(s);
  });
}

function ensureTokenClient() {
  if (tokenClient) return true;
  if (typeof google === 'undefined' || !google.accounts?.oauth2) return false;
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/calendar.events',
    callback: (resp: any) => {
      if (resp.access_token) {
        saveTokenData({
          accessToken: resp.access_token,
          expiresAt: Date.now() + (resp.expires_in || 3600) * 1000,
        });
      }
    },
  });
  return true;
}

export async function initGCal() {
  await loadGis();
  ensureTokenClient();
  if (tokenClient) {
    const td = getTokenData();
    if (td && td.expiresAt > Date.now()) return;
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

export function isGCalConnected(): boolean {
  const td = getTokenData();
  return !!td && td.expiresAt > Date.now();
}

export async function connectGCal(): Promise<boolean> {
  await loadGis();
  if (!ensureTokenClient()) return false;
  if (isGCalConnected()) return true;

  return new Promise((resolve) => {
    if (!tokenClient) { resolve(false); return; }
    tokenClient!.callback = (resp: any) => {
      if (resp.access_token) {
        saveTokenData({
          accessToken: resp.access_token,
          expiresAt: Date.now() + (resp.expires_in || 3600) * 1000,
        });
        resolve(true);
      } else {
        resolve(false);
      }
    };
    try {
      tokenClient!.requestAccessToken({ prompt: 'consent' });
    } catch (e) {
      console.error('GCal auth error:', e);
      resolve(false);
    }
  });
}

export function disconnectGCal() {
  const td = getTokenData();
  if (td?.accessToken && typeof google !== 'undefined') {
    (google.accounts.oauth2 as any).revoke(td.accessToken, () => {});
  }
  clearTokenData();
}

function getAccessToken(): string | null {
  const td = getTokenData();
  if (!td || td.expiresAt <= Date.now()) return null;
  return td.accessToken;
}

async function gcalFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getAccessToken();
  if (!token) throw new Error('Not connected to Google Calendar');
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar API error: ${res.status} ${err}`);
  }
  return res.json();
}

function buildEventBody(task: { title: string; description?: string; dueDate?: string }): any {
  if (!task.dueDate) return null;
  const start = task.dueDate;
  const d = new Date(task.dueDate + 'T23:59:59');
  d.setDate(d.getDate() + 1);
  const end = d.toISOString().split('T')[0];
  return {
    summary: task.title,
    description: task.description || '',
    start: { date: start },
    end: { date: end },
    transparency: 'transparent',
  };
}

export async function fetchEvents(timeMin: string, timeMax: string): Promise<any[]> {
  if (!isGCalConnected()) return [];
  try {
    const data = await gcalFetch(`/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`);
    return data.items || [];
  } catch { return []; }
}

export async function syncTaskToCalendar(task: { id: string; title: string; description?: string; dueDate?: string }): Promise<void> {
  if (!isGCalConnected() || !task.dueDate) return;
  const mapping = getMapping();
  const existingId = mapping[task.id];
  const body = buildEventBody(task);
  if (!body) return;

  try {
    if (existingId) {
      await gcalFetch(`/calendars/primary/events/${existingId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    } else {
      const event = await gcalFetch('/calendars/primary/events', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      mapping[task.id] = event.id;
      saveMapping(mapping);
    }
  } catch (e) {
    console.error('Calendar sync error:', e);
  }
}

export async function syncSessionToCalendar(session: { id: string; projectName: string; minutes: number; date: string }): Promise<void> {
  if (!isGCalConnected()) return;
  const today = new Date().toISOString().split('T')[0];
  if (session.date !== today) return;
  try {
    const start = session.date;
    const d = new Date(session.date + 'T23:59:59');
    d.setDate(d.getDate() + 1);
    await gcalFetch('/calendars/primary/events', {
      method: 'POST',
      body: JSON.stringify({
        summary: `🍅 ${session.minutes}min — ${session.projectName}`,
        start: { date: start },
        end: { date: d.toISOString().split('T')[0] },
        transparency: 'transparent',
      }),
    });
  } catch (e) {
    console.error('Calendar sync error (pomodoro):', e);
  }
}

export async function removeTaskFromCalendar(taskId: string): Promise<void> {
  if (!isGCalConnected()) return;
  const mapping = getMapping();
  const eventId = mapping[taskId];
  if (!eventId) return;

  try {
    await gcalFetch(`/calendars/primary/events/${eventId}`, { method: 'DELETE' });
    delete mapping[taskId];
    saveMapping(mapping);
  } catch (e) {
    console.error('Calendar delete error:', e);
  }
}
