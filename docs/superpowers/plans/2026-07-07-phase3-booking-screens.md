# Phase 3 (Domain 6) — Booking Screens Migration (sub-migrations 3–9)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development / executing-plans. Steps use `- [ ]`.

Continues the booking domain after the typed foundation (store + `preparingRequestBody` already typed in place). Migrates the booking screens/components into `src/features/booking/`. ZERO user-visible behavior change.

## Boundary decisions (locked)
- **`useBookingStore` (`@/stores`) and `preparingRequestBody` (`@/utils`) STAY at their current paths** (shared typed infra; events uses the store). Do NOT move them into `features/booking`. Booking screens/components import them from `@/stores` / `@/utils` as today.
- **`GuestForm.tsx`, `OtherMumukshuForm.tsx` STAY in `@/components/`** (used by events too).
- **`(payment)/bookingConfirmation.tsx`, `(payment)/paymentConfirmation`, `paymentFailed` stay** (payments-owned); booking reaches them by route string only.
- Route files (`app/booking/*`, `app/guestBooking/*`, `app/mumukshuBooking/*`, `(tabs)/book-now.tsx`, `(tabs)/bookings.tsx`) become thin re-exports via `@/features/booking` barrel; `_layout.tsx` files stay.

## Global Constraints (every task)
- No user-visible behavior change.
- **Lint:** `npm run lint` 0 problems. **Typecheck:** `npx tsc --noEmit --pretty false 2>&1 | grep -c "error TS"` ≤ 84 (currently 38 — must not regress; prefer to reduce).
- **Bundle gate:** on each screen/picker task + final: `npx expo export --platform android --output-dir /tmp/bk-export` exit 0; delete after.
- Booking code uses `features/booking/api.ts` or `apiClient` — never `axios`/`handleAPICall`. `RazorpayCheckout.open` stays (the intentional non-apiClient path).
- **🔴 5 Razorpay/submit paths — preserve BYTE-FOR-BYTE** (options object incl. `key/name/image/description/amount(raw paise)/currency/order_id/prefill/theme`, any pre-open delay, `amount===0` short-circuit, resolve→`/paymentConfirmation` / reject→`/paymentFailed`, Confirm/Pay-Later→`/bookingConfirmation`). The 3 review screens read DIFFERENT response envelopes: `/mumukshu/booking`→`data.order.{amount,id}`; `/guest/booking`→`data.data.{amount,id}`. Do NOT unify these readers. The 2 quick-book paths (RoomBooking one-day, FoodBooking self + FoodBooking guest-with-Razorpay) are separate — preserve each.
- **🔴 Store-push + validate payloads preserved verbatim** — `preparingRequestBody` outputs and the store slice shapes must not drift.
- Barrel: explicit named exports only (no `export *`).
- Commit after each task.

## Backend endpoints (from recon — preserve request/response readers exactly)
- `POST /mumukshu/validate` → `{data:{roomDetails,flatDetails,adhyayanDetails,foodDetails,travelDetails,utsavDetails,totalCharge}}`
- `POST /mumukshu/booking` → `{message, order:{id,amount}|{amount:0}, waitingBookingCountMap}`
- `POST /guest/validate` → `{data:{...same...}}`
- `POST /guest/booking` → `{message, data:{id,amount}|{amount:0}, totalAmount, orderId}`
- `POST /guest` (register) → `{message, guests:[...]}`
- `GET /adhyayan/getall?cardno&page` → `{message, data:[{title,data:Shibir[]}]}`; `GET /adhyayan/getrange`; `GET /utsav/upcoming?page` → array of utsav
- Cancellation: `GET /stay/bookings` + `POST /stay/cancel {bookingid}`; `GET /adhyayan/getbooked` + `DELETE /adhyayan/cancel {bookingid}`; `GET /utsav/booking` + `DELETE /utsav/booking {bookingid}`; `GET /travel/booking` + `DELETE /travel/booking {bookingid}`; `GET /food/get` + `GET /food/getGuestsForFilter` + `PATCH /food/cancel {cardno, food_data}`

---

## Sub-migration 3 — `features/booking/api.ts` + `types.ts`  (Task A)
**Files:** create `src/features/booking/types.ts`, `src/features/booking/api.ts`.
- [ ] **Step 1:** `types.ts` — one canonical `ValidationResponse` (`{roomDetails?, flatDetails?, adhyayanDetails?, foodDetails?, travelDetails?, utsavDetails?, totalCharge}`), `RazorpayOrder`, and `BookingType` re-exported from `@/stores/bookingTypes`. (Replaces the 3 hand-rolled local `ValidationData` interfaces later.)
- [ ] **Step 2:** `api.ts` — plain `apiClient` functions (screens keep their own useQuery/useMutation with EXACT existing config as queryFn/mutationFn — do NOT bake per-screen queryKey/staleTime into api.ts):
  `validateMumukshuBooking(body)`, `submitMumukshuBooking(body)`, `validateGuestBooking(body)`, `submitGuestBooking(body)`, `createGuests(cardno, guests)`, and cancellation fns `getStayBookings/cancelStay`, `getBookedAdhyayan/cancelAdhyayan`, `getUtsavBookings/cancelUtsavBooking`, `getTravelBookings/cancelTravelBooking`, `getFoodBookings/getFoodGuestsForFilter/cancelFood`, plus list hooks `useAdhyayanList(cardno)` (useInfiniteQuery, match `AdhyayanBooking.tsx` config) and `useUtsavList()` (match `EventsBooking.tsx`), and `getAdhyayanRange(params)`. Each fn returns the raw response body so callers read `data.order` vs `data.data` exactly as today. `createGuests` returns `res.guests`.
- [ ] **Step 3:** lint 0; typecheck ≤ 84. Commit `feat(booking): api.ts (validate/submit/cancel/list) + types`.

## Sub-migration 4 — Self tree  (Task B)
**Files:** `features/booking/screens/{SelfAddonScreen,SelfReviewScreen}.tsx`; move self-flavored addon components + details cards into `features/booking/components/`; thin `app/booking/[booking].tsx`, `bookingReview.tsx`; add to barrel.
- [ ] Read `app/booking/[booking].tsx` + `bookingReview.tsx` fully. Move → screens; swap `handleAPICall`→`api.ts` fns wrapped in the screens' EXISTING useQuery/useMutation config (verbatim). Keep `transformToMumukshuFormat` (self→mumukshu-of-one) verbatim; keep the 3-button submit (Confirm/Pay Now/Pay Later) + Razorpay #1 (`/mumukshu/booking`, `data.order.{amount,id}`) byte-identical. Move the addon components it renders + self details cards into `features/booking/components/`. Thin routes via barrel. Verify grep handleAPICall=0 in feature, lint 0, typecheck ≤84, bundle 0. Commit `refactor(booking): self tree into feature`.

## Sub-migration 5 — Guest tree  (Task C)
- [ ] Read `app/guestBooking/[booking].tsx` + `bookingReview.tsx` fully. Move → `features/booking/screens/{GuestAddonScreen,GuestReviewScreen}.tsx`; move `Guest*Addon` (×3) + `Guest*BookingDetails` (×5) into `features/booking/components/`. Swap to api.ts fns in the existing RQ wrappers. Preserve Razorpay #2 (`/guest/booking`, **`data.data.{amount,id}`**) + the `guestInfo` name-enrichment for `ChargeBreakdownBottomSheet` verbatim. Move `ChargeBreakdownBottomSheet` into `features/booking/components/` (booking-only). Thin routes; barrel. Gates. Commit `refactor(booking): guest tree into feature`.

## Sub-migration 6 — Mumukshu tree  (Task D — largest)
- [ ] Read `app/mumukshuBooking/[booking].tsx` (790) + `bookingReview.tsx` (750) fully. Move → `features/booking/screens/{MumukshuAddonScreen,MumukshuReviewScreen}.tsx`; move `Mumukshu*Addon` (×4) + `Mumukshu*BookingDetails` (×6) into `features/booking/components/`. Swap to api.ts fns in existing RQ wrappers. Preserve Razorpay #3 (`/mumukshu/booking`, `data.order.{amount,id}`), the multi-group + travel round-trip + flat-constraint logic, and `mumukshuInfo` enrichment verbatim. Thin routes; barrel. Gates. Commit `refactor(booking): mumukshu tree into feature`.

## Sub-migration 7 — Pickers  (Tasks E1–E3, group by size)
Move the 6 god-file pickers into `features/booking/screens/pickers/` and thin `(tabs)/book-now.tsx`. **Catalogue + preserve the quick-book bypasses verbatim.**
- [ ] **E1:** `RoomBooking.tsx` (875) + `FlatBooking.tsx` (318) → pickers. RoomBooking has 3 submit paths incl. "One Day Visit" (inline payload → `/mumukshu/booking` or `/guest`→`/guest/booking`, no addon/Razorpay) — preserve each. Use `createGuests` + submit fns from api.ts. Commit.
- [ ] **E2:** `FoodBooking.tsx` (653) + `TravelBooking.tsx` (669) → pickers. FoodBooking has Self instant-book AND Guest instant-book-with-Razorpay (**4th Razorpay site** — preserve options/routing byte-for-byte). Commit.
- [ ] **E3:** `AdhyayanBooking.tsx` (641) + `EventsBooking.tsx` (896) → pickers, using `useAdhyayanList`/`useUtsavList` from api.ts. Preserve the location-based branch (Research-Centre → straight to review). Thin `(tabs)/book-now.tsx` via barrel (it renders all 6). Gates. Commit.

## Sub-migration 8 — Cancellation  (Task F)
- [ ] Move the 5 cancellation components (`components/cancel booking/*`) + `BookingStatusDisplay`, `OldBookingsTrigger` into `features/booking/components/cancellation/`; move/keep `bookingHistoryFilter.ts` (already TS, shared? — it's booking-only per recon; move to feature) and type+move `BookingValidationStatusCounter.js`→`.ts`. Swap the cancellation GET/DELETE/PATCH `handleAPICall` calls to api.ts fns (in the components' existing RQ wrappers). Thin `(tabs)/bookings.tsx` via barrel. Gates. Commit `refactor(booking): cancellation into feature`.

## Sub-migration 9 — Cleanup + finalize  (Task G)
- [ ] Delete dead files: `src/components/OtherUsersForm.tsx`, `src/utils/mergeLists.js` (re-confirm 0 importers first). Fold booking-only shared components still in `@/components` (`AddonItem`, `PrimaryAddonBookingCard`) into `features/booking/components/`; update importers. Finalize `features/booking/index.ts` barrel (all booking screens; the pickers/cancellation are rendered by the hubs). Verify: all booking route files thin; no `handleAPICall` anywhere in `features/booking`; `GuestForm`/`OtherMumukshuForm` still shared; store/preparingRequestBody still at `@/stores`/`@/utils`; events still works. Final gates: lint 0, typecheck ≤ 84, bundle 0. Commit `refactor(booking): cleanup dead files + finalize feature`.

## Completion Gate (whole booking domain)
- [ ] lint 0; typecheck ≤ 84; `expo export` exit 0.
- [ ] All `app/booking|guestBooking|mumukshuBooking/*` + `(tabs)/book-now.tsx` + `(tabs)/bookings.tsx` are thin re-exports; `_layout`s unchanged.
- [ ] No `handleAPICall`/`axios` in `features/booking`.
- [ ] `GuestForm`/`OtherMumukshuForm` shared; `useBookingStore`/`preparingRequestBody` at `@/stores`/`@/utils`; `(payment)/bookingConfirmation` untouched; events booking hand-off still works.
- [ ] Dead files deleted (`OtherUsersForm`, `mergeLists`).
- [ ] Smoke-test: each of the 5 submit/Razorpay paths (self/guest/mumukshu review pay, RoomBooking one-day, FoodBooking guest instant-pay) + a cancellation of each type.

## Self-Review (author checklist — completed)
- Sequenced api→self→guest→mumukshu→pickers→cancellation→cleanup (destinations before entry points; complexity-ascending trees). ✓
- 5 Razorpay paths + 2 distinct response envelopes + store/validate payloads flagged for byte-for-byte preservation. ✓
- Shared code (store/requestBody/GuestForm/OtherMumukshuForm/bookingConfirmation) explicitly kept put. ✓
- Dead files (`OtherUsersForm`, `mergeLists`) deleted with re-confirm. ✓
