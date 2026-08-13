const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface User {
  id: string;
  email: string;
  name: string | null;
  profilePic: string | null;
  provider: 'GOOGLE' | 'EMAIL';
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('auth_token');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

export async function registerWithPassword(name: string, email: string, password: string): Promise<{ success: boolean; token?: string; user?: User; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return { success: true, token: data.token, user: data.user, message: data.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return { success: false, message };
  }
}

export async function loginWithPassword(email: string, password: string): Promise<{ success: boolean; token?: string; user?: User; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return { success: true, token: data.token, user: data.user, message: data.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return { success: false, message };
  }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send reset code');
    return { success: true, message: data.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send reset code';
    return { success: false, message };
  }
}

export async function resetPasswordWithCode(email: string, code: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset password');
    return { success: true, message: data.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    return { success: false, message };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      removeToken();
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}

export async function sendOTP(email: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    return { success: true, message: data.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send OTP';
    return { success: false, message };
  }
}

export async function verifyOTP(email: string, code: string): Promise<{ success: boolean; token?: string; user?: User; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
    return { success: true, token: data.token, user: data.user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to verify OTP';
    return { success: false, message };
  }
}

export async function sendMagicLink(email: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_URL}/api/auth/magic-link/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send magic link');
    return { success: true, message: data.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send magic link';
    return { success: false, message };
  }
}

export function getGoogleAuthURL(): string {
  return `${API_URL}/api/auth/google`;
}

export async function logout(): Promise<void> {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Ignore errors during logout
    }
  }
  removeToken();
}
