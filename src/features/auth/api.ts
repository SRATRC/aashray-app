// src/features/auth/api.ts
import { apiClient } from '@/lib/api/client';
import type { ApiEnvelope } from '@/lib/api/types';

// POST /client/verifyAndLogin
export function login(mobno: string, password: string, token?: string) {
  return apiClient.post<ApiEnvelope<any>>('/client/verifyAndLogin', { mobno, password, token });
}

// POST /client/forgotPassword
export function forgotPassword(mobno: string) {
  return apiClient.post<ApiEnvelope<{ email: string }>>('/client/forgotPassword', { mobno });
}
