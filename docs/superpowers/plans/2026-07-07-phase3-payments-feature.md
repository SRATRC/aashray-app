# Phase 3 (Domain 5) — Payments Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development / executing-plans. Steps use `- [ ]`.

**Goal:** Migrate the payments domain (pending-payments list + Razorpay pay flow + the payment result splash screens) into `src/features/payments/`, split the 986-line `pendingPayments.tsx` god file, route payment REST through a typed `api.ts`, and type the payment data. ZERO user-visible behavior change — the Razorpay flow must behave identically.

**Architecture:** `features/payments/` with `PendingPaymentsScreen` + extracted components + `paymentConfirmation`/`paymentFailed` result screens + `api.ts` + `types.ts` + barrel. Route files `(home)/pendingPayments.tsx`, `(payment)/paymentConfirmation.tsx`, `(payment)/paymentFailed.tsx` become thin re-exports; `(payment)/_layout.tsx` and `(payment)/bookingConfirmation.tsx` stay (bookingConfirmation is a booking-result screen reached only by booking flows — it migrates with the booking domain later). The Razorpay order→checkout flow lives inline in the screen; `api.ts` only wraps the two HTTP calls.

**Tech Stack:** RN 0.79 / Expo SDK 56, Expo Router 6, TS, NativeWind, TanStack React Query v5, `apiClient`, `react-native-razorpay`.

## Global Constraints
- No user-visible behavior change — the payment flow especially.
- **Lint gate:** `npm run lint` 0 problems each task. **Typecheck gate:** `npx tsc --noEmit --pretty false 2>&1 | grep -c "error TS"` MUST stay ≤ 84 (currently 38 — don't regress; prefer to reduce).
- **Bundle gate (pendingPayments task + final):** `npx expo export --platform android --output-dir /tmp/p3pay-export` exits 0; delete after.
- Feature code uses `features/payments/api.ts` or `apiClient` — never `axios`/`handleAPICall`. (`RazorpayCheckout.open` is the one intentional non-apiClient path — preserve it.)
- Route files import screens via the `@/features/payments` BARREL, never deep `@/features/*/*`.
- No `export *`.
- **🔴 RAZORPAY FIDELITY — preserve byte-for-byte:**
  1. The Razorpay options object exactly: `{ key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID, name, image, description, amount: result.data.amount (raw paise, do NOT re-multiply), currency: 'INR', order_id: result.data.id, prefill: {email, contact, name}, theme: {color: colors.orange} }`.
  2. The `InteractionManager.runAfterInteractions` + `setTimeout` (200ms Android / 100ms iOS) delay before `RazorpayCheckout.open(...)` — it guards an Android native-modal race after dismissing the international-warning modal. Do NOT drop or shorten it.
  3. The `result.data?.amount === 0` short-circuit (success toast, return, never open Razorpay).
  4. NO client-side verify/signature step — verification is a server webhook. `RazorpayCheckout.open()` resolve → invalidate + `router.replace('/paymentConfirmation')`; reject → `router.replace('/paymentFailed')`. Do NOT add any verify call.
  5. The existing no-op `queryClient.invalidateQueries({ queryKey: ['pendingPayments', user.cardno] })` in the result screens is a pre-existing bug (no query uses that key) — PRESERVE it verbatim (do NOT "fix" it to the real key; that would change behavior). Flag only.
- **Do NOT touch (booking domain):** `useBookingStore`, `preparingRequestBody`, the `booking|guestBooking|mumukshuBooking/bookingReview.tsx` files, `components/booking/FoodBooking.tsx` (these have their own separate Razorpay flows), `(payment)/bookingConfirmation.tsx`, `(payment)/_layout.tsx`.
- Payments defines its OWN `Transaction` type (pendingPayments' shape uses `| null` and differs from profile's) — do NOT couple to `features/profile`.
- Commit after each task.

## Verified backend contract (`/api/v1`, behind `validateCard`)
| Call | Method+endpoint | Request | Response |
|---|---|---|---|
| pending list | `GET /profile/transactions` | query `{ cardno, page: 1, page_size: 100, status: 'pending,cash pending,failed' }` | `{ message, data: Transaction[], pagination }` |
| create order | `POST /razorpay/payv2` | body `{ cardno, data: [{ bookingid, category }] }` | `{ message: 'payment successful', data: RazorpayOrder }` |
| verify | `POST /razorpay/verifyPayment` | Razorpay webhook (server-side only) | — (CLIENT NEVER CALLS THIS) |

- `RazorpayOrder` = `{ id: string; amount: number /*paise*/; currency: 'INR'; receipt?: string; status?: string }`.
- `Transaction` (as pendingPayments reads it): `bookingid, amount, category, status, discount, description, createdAt, booked_for, booked_by, start_day, end_day, name, booked_for_name` (pendingPayments uses `| null` on several — match the original file).
- `TransactionStatus`: `'pending' | 'cash pending' | 'completed' | 'authorized' | 'failed'`. Categories: `'room' | 'flat' | 'adhyayan' | 'utsav' | 'travel' | 'breakfast' | 'lunch' | 'dinner'`.
- `/payv2` request body is `{ cardno, data: [{bookingid, category}] }` (the API doc is WRONG — trust this).

---

## Task 1: `types.ts` + `api.ts`
**Files:** create `src/features/payments/types.ts`, `src/features/payments/api.ts`.

- [ ] **Step 1:** Read the current `src/app/(home)/pendingPayments.tsx` for the exact `Transaction`/`ApiResponse` shapes. Create `types.ts` with `Transaction` (match the original's optionality), `RazorpayOrder`, `PaymentCategory`, `TransactionStatus`.
- [ ] **Step 2:** Create `api.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { RazorpayOrder, Transaction } from './types';

const PENDING_STATUS = 'pending,cash pending,failed';

export const paymentKeys = {
  pending: (cardno: string) => ['transactions', cardno, PENDING_STATUS],
};

export function usePendingTransactions(cardno: string) {
  return useQuery<Transaction[]>({
    queryKey: paymentKeys.pending(cardno),
    queryFn: async () => {
      const res = await apiClient.get<{ message?: string; data: Transaction[] }>(
        '/profile/transactions',
        { params: { cardno, page: 1, page_size: 100, status: PENDING_STATUS } }
      );
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!cardno,
    staleTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
  });
}

// Creates the Razorpay order. Returns the full envelope so the screen reads
// `result.data.amount` / `result.data.id` EXACTLY as the original did.
export function createPaymentOrder(
  cardno: string,
  data: { bookingid: string; category: string }[]
) {
  return apiClient.post<{ message: string; data: RazorpayOrder }>('/razorpay/payv2', { cardno, data });
}
```
Confirm the original's query key / staleTime / refetchOnMount and the `/payv2` body/response shape; match exactly.

- [ ] **Step 3:** lint 0; typecheck ≤ 84. Commit `feat(payments): types + api (pending transactions, razorpay order)`.

---

## Task 2: Payment result screens (paymentConfirmation, paymentFailed)
**Files:** create `src/features/payments/screens/PaymentConfirmationScreen.tsx`, `PaymentFailedScreen.tsx`; barrel; thin `src/app/(payment)/paymentConfirmation.tsx`, `paymentFailed.tsx`.

- [ ] **Step 1:** Move both splash screens verbatim (Animated fade/slide, quote, CTAs, `router.dismissTo`/`router.push` targets unchanged). Keep the pre-existing no-op `invalidateQueries({ queryKey: ['pendingPayments', user.cardno] })` EXACTLY as-is (flag, don't fix). `paymentFailed`'s link to `/contactInfo` and "Try Again"→`/pendingPayments` unchanged.
- [ ] **Step 2:** Create `src/features/payments/index.ts` exporting `PaymentConfirmationScreen`, `PaymentFailedScreen`; thin the two route files via the barrel. Do NOT touch `(payment)/_layout.tsx` or `(payment)/bookingConfirmation.tsx`.
- [ ] **Step 3:** lint 0; typecheck ≤ 84. Commit `refactor(payments): move result splash screens into feature`.

---

## Task 3: pendingPayments god-file split + Razorpay flow (sensitive)
**Files:** create `src/features/payments/screens/PendingPaymentsScreen.tsx` + `components/{PaymentTimer,PendingPaymentItem,PaymentsSummaryCard}.tsx`; barrel; thin `src/app/(home)/pendingPayments.tsx`.

- [ ] **Step 1:** Read `src/app/(home)/pendingPayments.tsx` FULLY. Create `PendingPaymentsScreen.tsx` (default export). Swap data access: the pending list → `usePendingTransactions(cardno)` from `../api`; the order-creation mutation's `mutationFn` → `createPaymentOrder(cardno, paymentData)` from `../api`. Type the mutation input `{ bookingid: string; category: string }[]` and result `{ message; data: RazorpayOrder }`.
- [ ] **Step 2 — 🔴 preserve the Razorpay flow VERBATIM:** keep `proceedWithPayment` + `handleProceedToPayment` INLINE and byte-identical except for the `mutationFn` swap: the exact options object, the `InteractionManager`/`setTimeout(Platform delay)` before `.open()`, the `amount === 0` short-circuit, the international-warning `CustomModal` gate, and the resolve→invalidate+`router.replace('/paymentConfirmation')` / reject→`router.replace('/paymentFailed')` branches. Keep the mutation's `onSuccess` (selection clear + invalidate) exactly as the original. Do NOT add any verify step.
- [ ] **Step 3 — safe extraction only:** extract pure presentational pieces into `components/`: `PaymentTimer` (countdown badge), `PendingPaymentItem` (the transaction card `renderItem`, taking `{ item, selected, onToggle, ...formatting }`), `PaymentsSummaryCard` (the summary card). Pure formatting helpers (`getItemTitle`/`getDateRange`/`getDuration`/`getCategoryIcon`) can move to `features/payments/utils.ts` or into `PendingPaymentItem`. Keep selection state, derived selectors, and the whole Razorpay flow in `PendingPaymentsScreen`. Do NOT thread the mutation/selection through the item components beyond simple props.
- [ ] **Step 4:** barrel add `PendingPaymentsScreen`; thin `src/app/(home)/pendingPayments.tsx` → `import { PendingPaymentsScreen } from '@/features/payments'; export default PendingPaymentsScreen;`.
- [ ] **Step 5:** Verify `grep -rn "handleAPICall\|HandleApiCall" src/features/payments` → 0; `git status` shows nothing under `stores/`, `preparingRequestBody`, `components/booking*`, `(payment)/bookingConfirmation`, `(payment)/_layout`; lint 0; typecheck ≤ 84; **bundle exit 0**.
- [ ] **Step 6:** Commit `refactor(payments): split pending-payments screen; razorpay flow preserved`.

---

## Completion Gate
- [ ] lint 0; typecheck ≤ 84; `expo export` exit 0.
- [ ] `(home)/pendingPayments.tsx`, `(payment)/paymentConfirmation.tsx`, `(payment)/paymentFailed.tsx` are thin re-exports; `(payment)/_layout.tsx` + `bookingConfirmation.tsx` untouched.
- [ ] No `handleAPICall`/`axios` in `features/payments`.
- [ ] Booking domain untouched (store, preparingRequestBody, bookingReview screens, FoodBooking).
- [ ] Smoke-test (sensitive): open pending payments, select items, verify amounts/timers, tap Proceed (international-warning modal for non-India user), Razorpay sheet opens with correct amount → success routes to paymentConfirmation, cancel routes to paymentFailed; the amount==0 (fully discounted) path shows the success toast without opening Razorpay.

## Out of scope (flag)
- The no-op `['pendingPayments']` invalidation in the result screens (pre-existing bug; preserved, not fixed).
- De-duplicating `paymentConfirmation`/`bookingConfirmation` splash screens (would risk behavior; bookingConfirmation stays in booking scope).
- The 4 booking-domain Razorpay call sites (`bookingReview` ×3, `FoodBooking`) — migrate with booking.
- Centralizing `EXPO_PUBLIC_RAZORPAY_KEY_ID` (read inline; booking sites still use it inline until they migrate).

## Self-Review (author checklist — completed)
- **Spec coverage:** feature-folder, thin barrel routes, RQ query + plain order fn over apiClient, typed transaction/order data, god-file split (presentational only). ✓
- **Razorpay fidelity:** options object, pre-open delay, amount==0 short-circuit, no-verify, result-screen routing, no-op invalidation all called out to preserve verbatim; flow kept inline. ✓
- **Boundary:** booking store/util/bookingReview/FoodBooking/bookingConfirmation/_layout untouched; result screens moved safely (route-string nav, no import coupling); payments owns its own Transaction type (no profile coupling). ✓
- **Type consistency:** `usePendingTransactions`/`createPaymentOrder`/`paymentKeys` consistent across api.ts (Task 1) and screen (Task 3); `Transaction`/`RazorpayOrder` single-sourced.
