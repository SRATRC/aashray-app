// src/features/wifi/types.ts
// Backend-accurate (verified against aashray-backend wifi controller/models).
export type PermanentWifiStatus = 'pending' | 'approved' | 'rejected' | 'reset';

export interface TempWifiCode {
  password: string;
  createdAt?: string;
}

export interface PermanentWifiCode {
  id: number;
  username?: string;
  code?: string | null;
  ssid?: string | null;
  status: PermanentWifiStatus;
  requested_at?: string;
  reviewed_at?: string | null;
  admin_comments?: string | null;
}
