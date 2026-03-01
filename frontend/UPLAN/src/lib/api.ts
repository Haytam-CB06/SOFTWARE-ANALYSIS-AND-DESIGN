// src/lib/api.ts
export const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  'https://uplan-backend-gr4k.onrender.com';

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
  return (
    localStorage.getItem('authToken') ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    null
  );
}

function getCurrentUserId(): string | null {
  return (
    localStorage.getItem('currentUserId') ||
    localStorage.getItem('userId') ||
    localStorage.getItem('user_id') ||
    null
  );
}

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  const userId = getCurrentUserId();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (userId) headers['X-User-Id'] = userId;
  return headers;
}

export async function apiJson<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: any,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const headers: Record<string, string> = {
    ...(extraHeaders || {}),
  };

  // Only set JSON content-type when we're sending a JSON body.
  if (body !== undefined && !(body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // If callers didn't explicitly set auth headers, attach them automatically.
  // (Safe for endpoints that ignore them.)
  const authHeaders = buildAuthHeaders();
  for (const [k, v] of Object.entries(authHeaders)) {
    if (!headers[k]) headers[k] = v;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
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

/**
 * Same as apiJson, but enforces that a user id exists (for endpoints that require it).
 */
export async function apiJsonAuthed<T>(
  path: string,
  method: HttpMethod = 'GET',
  body?: any,
  extraHeaders?: Record<string, string>
): Promise<T> {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new ApiError('Missing user_id. Please log in again.', 401, null);
  }
  return apiJson<T>(path, method, body, { ...(extraHeaders || {}), 'X-User-Id': userId });
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
