// src/features/auth/api.ts
import { apiClient } from '@/lib/api/client';

interface Envelope<T> {
  message?: string;
  data: T;
}

// POST /client/verifyAndLogin
export function login(mobno: string, password: string, token?: string) {
  return apiClient.post<Envelope<any>>('/client/verifyAndLogin', { mobno, password, token });
}

// POST /client/forgotPassword
export function forgotPassword(mobno: string) {
  return apiClient.post<Envelope<{ email: string }>>('/client/forgotPassword', { mobno });
}
