// src/features/payments/types.ts

// Mirrors the categories used across the pending-payments UI (icon/title lookups).
// Kept separate from `Transaction.category` (plain `string`, matching the
// original screen exactly) since the backend can send values not listed here.
export type PaymentCategory =
  | 'room'
  | 'flat'
  | 'adhyayan'
  | 'utsav'
  | 'travel'
  | 'breakfast'
  | 'lunch'
  | 'dinner'
  | 'other';

// Mirrors the statuses fetched by the pending-payments query
// (`status=pending,cash pending,failed`). Kept separate from
// `Transaction.status` (plain `string`) for the same reason as above.
export type TransactionStatus = 'pending' | 'cash pending' | 'failed' | 'success';

// Matches the `Transaction` interface in the original
// `src/app/(home)/pendingPayments.tsx` exactly, including its `| null`
// optionality (this is payments' own copy, not a reuse of profile's Transaction,
// which uses `?` instead of `| null`).
export interface Transaction {
  bookingid: string;
  amount: number;
  category: string;
  status: string;
  discount: number;
  description: string | null;
  createdAt: string;
  booked_for: string | null;
  booked_by: string | null;
  start_day: string | null;
  end_day: string | null;
  name: string | null;
  booked_for_name: string | null;
}

// Shape of `result.data` from `POST /razorpay/payv2`, as read by the original
// screen (`result.data.amount`, `result.data.id`) to build the Razorpay
// checkout options.
export interface RazorpayOrder {
  id: string;
  amount: number; // paise
  currency: string;
  receipt?: string;
  status?: string;
}
