// src/features/profile/types.ts

export type Gender = 'M' | 'F';

export interface ProfileCredits {
  room?: number;
  travel?: number;
  food?: number;
  utsav?: number;
}

export interface Profile {
  cardno: string;
  issuedto?: string;
  gender?: Gender;
  dob?: string;
  idType?: string;
  idNo?: string;
  address?: string;
  mobno?: string | number;
  email?: string;
  country?: string;
  state?: string;
  city?: string;
  pin?: string;
  center?: string;
  pfp?: string;
  credits?: ProfileCredits;
  res_status?: string;
  status?: string;
  isFlatOwner?: boolean;
  showDevelopmentDashboard?: boolean;
}

// Body accepted by PUT /profile. Re-exported (not re-declared) so this type can
// never drift from the actual form used to produce it — ProfileForm.tsx is the
// source of truth for these field names/types (note: `gender` is a plain
// string there, not the narrower `Gender` union above).
export type { ProfileFormData } from '@/components/ProfileForm';

export interface Transaction {
  bookingid: string;
  amount: number;
  category: string;
  status: string;
  discount?: number;
  description?: string;
  createdAt: string;
  booked_for?: string;
  booked_by?: string;
  start_day?: string;
  end_day?: string;
  name?: string;
  booked_for_name?: string;
}
