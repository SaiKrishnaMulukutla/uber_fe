export type UserRole = 'rider' | 'driver';

interface JWTClaims {
  user_id: string;
  email: string;
  role: UserRole;
  exp: number;
}

export function parseJWT(token: string): JWTClaims | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded as JWTClaims;
  } catch {
    return null;
  }
}

export function isExpired(token: string): boolean {
  const claims = parseJWT(token);
  if (!claims) return true;
  return Date.now() / 1000 >= claims.exp - 30; // 30s buffer
}

export function getRole(token: string): UserRole | null {
  return parseJWT(token)?.role ?? null;
}

export function getUserId(token: string): string | null {
  return parseJWT(token)?.user_id ?? null;
}

export function getEmail(token: string): string | null {
  return parseJWT(token)?.email ?? null;
}
