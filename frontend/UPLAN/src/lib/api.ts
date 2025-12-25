// src/lib/api.ts
export const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  'http://localhost:8000';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status: number;
  body: any;
  constructor(message: string, status: number, body: any) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem('access_token') || localStorage.getItem('token') || null;
}

export async function apiJson<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: any,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extraHeaders || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let parsed: any = null;
  const text = await res.text();
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    const msg =
      (parsed && (parsed.detail || parsed.message)) ||
      `Request failed: ${method} ${path} (${res.status})`;
    throw new ApiError(msg, res.status, parsed);
  }
  return parsed as T;
}

export async function getBackendUserIdByEmail(email: string): Promise<string | null> {
  if (!email) return null;

  const cacheKey = `backendUserId:${email}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const rows = await apiJson<any[]>(`/timetable/admin/all-users`, 'GET');
    const match = rows.find((r: any) => (r?.email || '').toLowerCase() === email.toLowerCase());
    const id = match?.user_id ? String(match.user_id) : null;
    if (id) localStorage.setItem(cacheKey, id);
    return id;
  } catch {
    return null;
  }
}
