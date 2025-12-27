// Backend API helpers
// Backend routers are mounted at root (e.g., /timetable, /notifications)

export type BackendNotification = {
  id: string;
  user_id: string;
  session_id?: string | null;
  channel: string;
  template: string;
  send_at: string; // ISO string
  status: string;
  error_message?: string | null;
};

export type TimetableMeetingUpdate = {
  day_of_week?: number;
  start_time?: string; // HH:MM
  end_time?: string;   // HH:MM
  rrule?: string | null;
};

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;

function baseUrl(): string {
  if (!API_BASE_URL) {
    throw new Error(
      'VITE_API_BASE_URL is not set. Add it to your .env (e.g., VITE_API_BASE_URL=http://localhost:8000).'
    );
  }
  return API_BASE_URL.replace(/\/$/, '');
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function jsonOrThrow(res: Response) {
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || text || res.statusText;
    throw new Error(typeof detail === 'string' ? detail : 'Request failed');
  }
  return data;
}

// ---------------- Timetable ----------------

export async function updateTimetableMeeting(meetingId: string, update: TimetableMeetingUpdate) {
  if (!isUuidLike(meetingId)) {
    // If it's not a UUID, we cannot safely call backend meeting update.
    return { skipped: true };
  }

  const res = await fetch(`${baseUrl()}/timetable/meeting/${meetingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  return jsonOrThrow(res);
}

// ---------------- Notifications ----------------

export async function listBackendNotifications(userId: string, limit = 50): Promise<BackendNotification[]> {
  if (!isUuidLike(userId)) return [];
  const url = new URL(`${baseUrl()}/notifications/`);
  url.searchParams.set('user_id', userId);
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString(), { method: 'GET' });
  return (await jsonOrThrow(res)) as BackendNotification[];
}

export async function createBackendNotification(payload: {
  user_id: string;
  template: string;
  channel?: 'alarm' | 'email' | 'push';
  send_at?: string; // ISO with timezone offset
  session_id?: string | null;
}): Promise<BackendNotification | null> {
  if (!isUuidLike(payload.user_id)) return null;

  const res = await fetch(`${baseUrl()}/notifications/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: payload.user_id,
      session_id: payload.session_id ?? null,
      channel: payload.channel ?? 'alarm',
      template: payload.template,
      send_at: payload.send_at,
    }),
  });

  return (await jsonOrThrow(res)) as BackendNotification;
}

export async function markBackendNotificationRead(notificationId: string): Promise<BackendNotification | null> {
  if (!isUuidLike(notificationId)) return null;
  const res = await fetch(`${baseUrl()}/notifications/${notificationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'sent' }),
  });
  return (await jsonOrThrow(res)) as BackendNotification;
}

export async function deleteBackendNotification(notificationId: string): Promise<void> {
  if (!isUuidLike(notificationId)) return;
  const res = await fetch(`${baseUrl()}/notifications/${notificationId}`, { method: 'DELETE' });
  await jsonOrThrow(res);
}
