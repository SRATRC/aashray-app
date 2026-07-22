// src/features/maintenance/types.ts

// Backend status values, from aashray-app/src/constants/status.js
// (STATUS_OPEN='open', STATUS_IN_PROGRESS='in progress', STATUS_CLOSED='closed').
export type MaintenanceStatus = 'open' | 'closed' | 'in progress';

export interface MaintenanceRequest {
  bookingid: string;
  requested_by?: string;
  department: string;
  work_detail: string;
  area_of_work?: string;
  comments?: string | null;
  status: MaintenanceStatus;
  finished_at?: string | null;
  createdAt: string;
}

export interface MaintenanceForm {
  department: string;
  work_detail: string;
  area_of_work: string;
}

// Moved verbatim from the original screen (`(home)/maintenanceRequestList.tsx`).
// Shape matches CustomSelectBottomSheet's `Option` (key/value), which reads
// `saveKeyInsteadOfValue` (default true) so the form stores `key`, not `value`.
// Do NOT switch to the backend /maintenance/departments endpoint — behavior change.
export const DEPARTMENT_LIST = [
  { key: 'Electrical', value: 'Electrical' },
  { key: 'housekeeping', value: 'House Keeping' },
  { key: 'Maintenance', value: 'Maintenance' },
];
