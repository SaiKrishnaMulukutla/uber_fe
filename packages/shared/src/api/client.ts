const BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as Record<string, unknown>).env)
  ? (import.meta as { env: Record<string, string> }).env.VITE_API_BASE_URL ?? 'http://localhost:8000'
  : 'http://localhost:8000';

let _getToken: (() => string | null) | null = null;
let _onUnauthorized: (() => void) | null = null;

export function configureClient(opts: {
  getToken: () => string | null;
  onUnauthorized: () => void;
}) {
  _getToken = opts.getToken;
  _onUnauthorized = opts.onUnauthorized;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  skipAuth = false,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };

  if (!skipAuth && _getToken) {
    const token = _getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401 && !skipAuth) {
    _onUnauthorized?.();
    throw new ApiError(401, 'Unauthorized');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, skipAuth = false) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }, skipAuth),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
};
