import moment from 'moment';

import handleAPICall from '@/src/utils/HandleApiCall';

/**
 * The one query behind "what does this member still owe". The home alert and the
 * Pending payments screen both read it, so they share one cache entry, one
 * request and one invalidation.
 */
export const PENDING_PAYMENT_STATUSES = 'pending,cash pending,failed';

export const pendingPaymentsQueryKey = (cardno: string) =>
  ['transactions', cardno, PENDING_PAYMENT_STATUSES] as const;

export interface PendingTransaction {
  amount?: number | string;
  status?: string;
  createdAt: string;
  [key: string]: any;
}

// The backend cancels an unpaid online booking 24h after it was created
// (MAX_APP_PAYMENT_DURATION_MINUTES = 24 * 60 in config/constants.js) and only
// looks at pending / failed transactions. A cash pending one, raised by an
// admin, has no expiry.
export const PAYMENT_WINDOW_HOURS = 24;

// The cron only touches cards whose country is India (getPendingTransactions),
// so for anyone else an old pending / failed payment stays owed and payable
// (/payv2 accepts it at any age). A missing country never expires.
// Must equal MySQL `country = 'India'` under utf8mb4_0900_ai_ci: case- and
// accent-insensitive, but NO PAD, so leading/trailing spaces make it differ.
// Do not trim.
export const isIndiaCountry = (country?: string | null) =>
  String(country ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase() === 'india';

export const isTransactionExpiredAt = (
  transaction: PendingTransaction,
  nowMs: number,
  country?: string | null
) => {
  if (!isIndiaCountry(country)) return false;
  if (transaction.status === 'cash pending') return false;
  return moment
    .utc(nowMs)
    .isAfter(moment.utc(transaction.createdAt).add(PAYMENT_WINDOW_HOURS, 'hours'));
};

export const fetchPendingPayments = <T = PendingTransaction>(
  cardno: string,
  errorMessage = 'Failed to fetch pending payments'
): Promise<T[]> =>
  new Promise((resolve, reject) => {
    handleAPICall(
      'GET',
      '/profile/transactions',
      { cardno, page: 1, page_size: 100, status: PENDING_PAYMENT_STATUSES },
      null,
      (res: any) => resolve(Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []),
      () => {},
      (error: any) => reject(new Error(error?.message || errorMessage)),
      false
    );
  });
