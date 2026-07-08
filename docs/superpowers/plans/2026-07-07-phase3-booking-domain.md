# Phase 3 (Domain 6, FINAL) — Booking Domain: Master Roadmap + Foundation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development / executing-plans. Steps use `- [ ]`.

Booking is the largest domain (~9,300 lines, ~65 files, 3 near-duplicate trees, a shared untyped mega-store, a shared untyped request-body builder, and 5 distinct submit/Razorpay paths). It is executed as an ordered sequence of **sub-migrations**, each its own reviewable unit. This document holds the master roadmap and the detailed plan for the FIRST chunk (the typed foundation). Sub-migrations 3–9 each get their own plan when reached.

## Master roadmap (9 sub-migrations, de-risk shared/coupled pieces first)
1. **Type `useBookingStore` in place** — `.js`→`.ts`, delete ~15 dead methods, type the 10 live ones + state. Path stays `@/stores/useBookingStore` (no importer churn). ← THIS PLAN, Task 1–2.
2. **Type `preparingRequestBody` in place** — `.js`→`.ts`, delete dead `prepareSelfRequestBody`, type the 2 live builders against the store types + backend request shapes. ← THIS PLAN, Task 3.
3. `features/booking/api.ts` — wrap every booking `handleAPICall` site into typed RQ hooks/fns over `apiClient` (preserve each screen's exact queryKey/staleTime/enabled).
4. Self tree (`app/booking/*`) → `features/booking` (smallest; proves the pattern).
5. Guest tree (`app/guestBooking/*`) → `features/booking` (2nd Razorpay site).
6. Mumukshu tree (`app/mumukshuBooking/*`) → `features/booking` (largest/riskiest; 3rd Razorpay, travel round-trip, flat constraints).
7. The 6 primary pickers (`components/booking/*`) → `features/booking`; thin `(tabs)/book-now.tsx`. Catalogue the quick-book bypasses (RoomBooking one-day, FoodBooking self + guest-with-Razorpay = 4th/5th sites).
8. Cancellation (`components/cancel booking/*`) → `features/booking`; thin `(tabs)/bookings.tsx`. Fully decoupled, low risk.
9. Cleanup — delete dead files (`OtherUsersForm`, `mergeLists`), fold booking-only shared components (`AddonItem`, `PrimaryAddonBookingCard`, `ChargeBreakdownBottomSheet`, `BookingStatusDisplay`, `OldBookingsTrigger`) into `features/booking/`, move store+requestBody into `features/booking/` and export the store via the barrel; final sweep.

**Kept shared (NOT moved into `features/booking/`):** `GuestForm.tsx`, `OtherMumukshuForm.tsx` (used by events too). **Stays put:** `(payment)/bookingConfirmation.tsx`. **Events keeps working** via `useBookingStore` (public path) + route strings.

---

# THIS PLAN: Typed Foundation (sub-migrations 1–2)

**Goal:** Convert `useBookingStore` and `preparingRequestBody` from untyped JS to TypeScript **in place** (no move, no importer changes), deleting confirmed dead code and adding accurate types. This de-risks every later booking sub-migration and lets events drop its `as any` casts. ZERO behavior change.

**Architecture:** Rename both files `.js`→`.ts` at their current paths (`src/stores/useBookingStore.ts`, `src/utils/preparingRequestBody.ts`). Add `src/stores/bookingTypes.ts` (or co-locate) with the discriminated types. Keep every live method's name/signature/runtime behavior identical; delete only grep-verified-dead surface.

## Global Constraints
- No behavior change; live method signatures + the exact request-body outputs stay identical.
- **Lint gate:** `npm run lint` 0 problems each task. **Typecheck gate:** `npx tsc --noEmit --pretty false 2>&1 | grep -c "error TS"` MUST stay ≤ 84 (currently 38 — must NOT regress; expect it to stay ~38 or drop).
- **Dead-code deletion rule:** before deleting any store method or export, re-grep the WHOLE `src/` for its name AND for bracket/dynamic access (`store[`, `['methodName']`) — delete only if truly zero call sites. List every deletion in the report.
- The two files must keep their current import paths (`@/stores` barrel re-exports `useBookingStore`; `@/utils/preparingRequestBody`) so no other file changes.
- Commit after each task.

## Verified dead surface (from recon — RE-CONFIRM before deleting)
- **Store dead methods:** `setData, updateBooking, mergeBookingData, mergeGuestBookingData, mergeMumukshuBookingData, cleanupValidationState, resetValidationState, clearAllBookingData, clearBookingType, setPrimaryBookingType, getPrimaryBookingType, getBookingData, getAllBookingDataForType, hasAnyBookingData, getStateSummary` + the `data: {}` slice.
- **Store LIVE (keep + type):** state `guestData, mumukshuData, guestInfo, mumukshuInfo`; methods `setGuestData, setMumukshuData, setGuestInfo, setMumukshuInfo, updateGuestBooking, updateMumukshuBooking`.
- **preparingRequestBody dead:** `prepareSelfRequestBody`. **LIVE:** `prepareGuestRequestBody`, `prepareMumukshuRequestBody`.

## Backend request shapes (preparingRequestBody must keep producing these — verify field-by-field)
Guest/Mumukshu output: `{ cardno, primary_booking: { booking_type, details }, addons: [{ booking_type, details }] }` where per booking_type `details` is:
- room: `{ checkin_date, checkout_date, guestGroup|mumukshuGroup: [{ roomType?, floorType?, guests|mumukshus: [cardno] }] }`
- food: `{ start_date, end_date, guestGroup|mumukshuGroup: [{ meals?, spicy?, high_tea?, guests|mumukshus: [cardno] }] }`
- adhyayan: `{ shibir_ids: [id], guests|mumukshus: [cardno] }`
- travel (mumukshu only): `{ date, mumukshuGroup: [{ pickup_point, drop_point, arrival_time, luggage, leaving_post_adhyayan, type, total_people, comments }] }`
- flat: `{ checkin_date, checkout_date, guests|mumukshus: [cardno] }`
- utsav: `{ utsavid, guests|mumukshus: [{ cardno, packageid, arrival, volunteer, carno, other }] }`
Both builders strip metadata keys (`validationData, dismissedValidationError, errorAlreadyShown, errorMessage`) from addons and throw `Unsupported {addon,primary} type` otherwise. Mumukshu builder has `transformMumukshuGroup` back-fill (per-group field pulled from first member that has it) — preserve verbatim.

---

## Task 1: Type the store state + delete dead surface
**Files:** rename `src/stores/useBookingStore.js` → `src/stores/useBookingStore.ts`; create `src/stores/bookingTypes.ts`; verify `src/stores/index.js` re-export still resolves.

- [ ] **Step 1:** Re-grep to CONFIRM each "dead" method has zero call sites: for each name in the dead list run `grep -rn "<name>" src` (and `grep -rn "\\['<name>'\\]\|store\\.<name>\|\\[.<name>." src` for dynamic access). Record counts. Only proceed to delete names that are truly 0.
- [ ] **Step 2:** Create `src/stores/bookingTypes.ts`:
```ts
export type BookingType = 'room' | 'travel' | 'food' | 'adhyayan' | 'utsav' | 'flat';

// Per-type form payloads are intentionally loose here (the precise per-type
// shapes are enforced in preparingRequestBody's input types); the store just
// holds "the current selection per booking type + which is primary".
export interface BookingSlice {
  primary?: BookingType;
  room?: unknown;
  travel?: unknown;
  food?: unknown;
  adhyayan?: unknown;
  utsav?: unknown;
  flat?: unknown;
  validationData?: unknown;
}

export interface PersonInfo {
  cardno: string;
  name?: string;
  issuedto?: string;
}

export interface BookingStoreState {
  guestData: BookingSlice;
  mumukshuData: BookingSlice;
  guestInfo: PersonInfo[];
  mumukshuInfo: PersonInfo[];
  setGuestData: (updater: BookingSlice | ((prev: BookingSlice) => BookingSlice)) => void;
  setMumukshuData: (updater: BookingSlice | ((prev: BookingSlice) => BookingSlice)) => void;
  setGuestInfo: (info: PersonInfo[]) => void;
  setMumukshuInfo: (info: PersonInfo[]) => void;
  updateGuestBooking: (bookingType: BookingType, item: unknown) => void;
  updateMumukshuBooking: (bookingType: BookingType, item: unknown) => void;
}
```
(Adjust field names to match the real store exactly after reading it — e.g. if `setGuestData` takes only an object, not a function-updater, match reality.)
- [ ] **Step 3:** Rewrite `useBookingStore.ts` as `create<BookingStoreState>()(...)` keeping ONLY the live state + 6 live methods, with their CURRENT runtime logic byte-identical (incl. `cleanStateSlice`'s "delete every other booking-type key + set primary" behavior in `updateGuestBooking`/`updateMumukshuBooking`, and the `try/catch` may be kept or dropped — keep it to be safe). Delete the dead `data` slice + 15 dead methods.
- [ ] **Step 4:** Confirm `src/stores/index.js` still `export { useBookingStore }` resolves against the `.ts` file (Metro/TS resolve `.ts` the same). No other importer changes.
- [ ] **Step 5:** Verify: `npm run lint` 0; typecheck ≤ 84 (ideally lower — events' `as any` may now be removable, but that's optional and can stay). App-level: the store's public shape is unchanged, so all consumers compile.
- [ ] **Step 6:** Commit `refactor(booking): type useBookingStore, delete dead store methods`.

## Task 2: (optional, same task acceptable) remove events `as any` casts
- [ ] If typing the store made `updateMumukshuBooking`/`updateGuestBooking` accept the events call sites without `as any`, remove those casts in `features/events/screens/AdhyayanDetailScreen.tsx` + `UtsavDetailScreen.tsx`. If it still needs a cast (item is `unknown`), LEAVE the casts — do not loosen the store type just to remove them. Lint 0; typecheck ≤ 84. Commit `refactor(events): drop as-any store casts now that the store is typed` (skip if not cleanly removable).

## Task 3: Type `preparingRequestBody` + delete dead builder
**Files:** rename `src/utils/preparingRequestBody.js` → `.ts`; import types from `@/stores/bookingTypes`.
- [ ] **Step 1:** Re-grep `prepareSelfRequestBody` → confirm 0 call sites; delete it.
- [ ] **Step 2:** Type `prepareGuestRequestBody(user, guestData)` and `prepareMumukshuRequestBody(user, mumukshuData)` and their internal helpers (`transformMumukshuGroup`, per-type detail builders). Define the per-type INPUT form types (guest vs mumukshu variants) and the OUTPUT request types matching the backend shapes above. **Keep the runtime output byte-identical** — verify each produced `details` object field-by-field against the current JS. The metadata-strip and `Unsupported {addon,primary} type` throw stay.
- [ ] **Step 3:** Verify no importer of `@/utils/preparingRequestBody` breaks (the 3 bookingReview + 3 addon screens). `npm run lint` 0; typecheck ≤ 84.
- [ ] **Step 4:** Commit `refactor(booking): type preparingRequestBody, delete dead prepareSelfRequestBody`.

---

## Completion Gate (foundation)
- [ ] lint 0; typecheck ≤ 84 (no regression).
- [ ] `useBookingStore.ts` + `preparingRequestBody.ts` are TS; dead surface deleted (listed in reports); live signatures + runtime behavior unchanged.
- [ ] `@/stores` + `@/utils/preparingRequestBody` import paths unchanged; all consumers compile.
- [ ] Bundle sanity: `npx expo export --platform android` exit 0 (run once at foundation end).
- [ ] Booking screens/components NOT yet moved (that's sub-migrations 3–9).

## Self-Review (author checklist — completed)
- **Scope realism:** booking decomposed into 9 sub-migrations; this plan executes only the typed foundation (1–2) — the rest get their own plans. ✓
- **Dead-code safety:** confirm-then-delete rule with dynamic-access grep; every deletion listed. ✓
- **Coupling preserved:** files stay at current paths (no importer churn); store public shape unchanged; GuestForm/OtherMumukshuForm/bookingConfirmation untouched; preparingRequestBody output verified field-by-field. ✓
- **Risk:** the one real risk is preparingRequestBody typing masking a shape change — mitigated by field-by-field verification against the current JS + the documented backend shapes.
