// src/lib/api.ts
export const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  (((globalThis as any).location?.hostname === 'localhost' || (globalThis as any).location?.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : 'https://software-analysis-and-design.onrender.com');

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const pendingGetRequests = new Map<string, Promise<any>>();
const responseCache = new Map<string, { expiresAt: number; value: any }>();
const DEFAULT_GET_CACHE_MS = Number((import.meta as any).env?.VITE_API_GET_CACHE_MS || 10000);
const DEFAULT_REQUEST_TIMEOUT_MS = Number((import.meta as any).env?.VITE_API_TIMEOUT_MS || 12000);

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

  const requestKey =
    method === 'GET' && body === undefined
      ? `${API_BASE_URL}${path}:${JSON.stringify(Object.entries(headers).sort())}`
      : '';

  if (requestKey) {
    const cached = responseCache.get(requestKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;

    const pending = pendingGetRequests.get(requestKey);
    if (pending) return pending as Promise<T>;
  }

  const request = (async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_REQUEST_TIMEOUT_MS);

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      signal: controller.signal,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    }).finally(() => window.clearTimeout(timeoutId));

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

    if (requestKey && DEFAULT_GET_CACHE_MS > 0) {
      responseCache.set(requestKey, {
        expiresAt: Date.now() + DEFAULT_GET_CACHE_MS,
        value: parsed,
      });
    }

    if (method !== 'GET') {
      responseCache.clear();
    }

    return parsed as T;
  })();

  if (requestKey) {
    pendingGetRequests.set(requestKey, request);
    request.finally(() => pendingGetRequests.delete(requestKey));
  }

  return request;
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
