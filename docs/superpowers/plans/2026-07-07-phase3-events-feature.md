# Phase 3 (Domain 4) — Events Feature (adhyayan + utsav) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development / executing-plans. Steps use `- [ ]`.

**Goal:** Migrate the events domain (adhyayan + utsav detail screens, feedback screens, utsav static screens) into a single `src/features/events/`, route event REST through a typed `api.ts`, add real `Adhyayan`/`Utsav` types (mostly `any` today), and split the two god files (~971 + ~1281 lines) into composed presentational sections. ZERO user-visible behavior change.

**Architecture:** One `features/events/` (adhyayan and utsav share the same screen shape + booking-handoff + feedback mechanism). Route files under `src/app/adhyayan/*` and `src/app/utsav/*` become thin re-exports via the barrel; `_layout.tsx` files stay. Detail screens keep handing booking intent to the shared `useBookingStore` and navigating into the booking domain — that boundary is untouched.

**Tech Stack:** RN 0.79 / Expo SDK 56, Expo Router 6, TS, NativeWind, TanStack React Query v5, `apiClient`, Zustand (shared booking store).

## Global Constraints
- No user-visible behavior change.
- **Lint gate:** `npm run lint` 0 problems each task. **Typecheck gate:** `npx tsc --noEmit --pretty false 2>&1 | grep -c "error TS"` MUST stay ≤ 84 (currently 81 — don't regress; prefer to reduce).
- **Bundle gate (each detail-screen task + final):** `npx expo export --platform android --output-dir /tmp/p3e-export` exits 0; delete after.
- Feature code uses `features/events/api.ts` or `apiClient` — never `axios`/`handleAPICall`.
- Route files import screens via the `@/features/events` BARREL, never deep `@/features/*/*`.
- No `export *`.
- **🔴 LOAD-BEARING RULE — preserve the store-push shape byte-for-byte.** The events screens call `updateGuestBooking('adhyayan'|'utsav', <obj>)` and `updateMumukshuBooking('adhyayan'|'utsav', <obj>)`, and also set self-booking data via the store. `src/utils/preparingRequestBody.js` (booking domain, untyped JS) reads the EXACT shape pushed: `data.adhyayan.adhyayan.id`, `data.utsav.utsav.utsav_id`, `.package`, `.arrival`, `.volunteer`, `.carno`, `.other`. The type checker will NOT catch a drift (store is `any`). Do NOT rename/restructure any field in the objects pushed to the store. Casting `as any` at the `update*Booking` call site is expected and fine.
- **Preserve route paths exactly** (`src/app/adhyayan/[id].tsx`, `src/app/adhyayan/feedback/[id].tsx`, `src/app/utsav/[id].tsx`, `src/app/utsav/feedback/[id].tsx`, `src/app/utsav/dailySchedule.tsx`, `src/app/utsav/utsavGuidelines.tsx`) — booking's cancellation screens navigate to the feedback routes by string (`router.push('/adhyayan/feedback/:id')`), an invisible dependency ESLint won't catch. Thin re-exports keep these working; do NOT rename/move the route files.
- **Do NOT touch / do NOT move (booking domain, migrated later):** `src/stores/useBookingStore.js`, `src/utils/preparingRequestBody.js`, `src/components/booking/AdhyayanBooking.tsx` + `EventsBooking.tsx`, all `booking details cards/*`, `booking addons/*`, `cancel booking/*`, the `booking|guestBooking|mumukshuBooking/[booking].tsx` + `bookingReview.tsx` families, `(tabs)/book-now.tsx`, and the `types.js` booking-type constants (events imports them, doesn't own them).
- **Leave generic in `@/components`:** `SteppedFeedback/*` (generic; only events consumes it today, but it has zero event knowledge), `GuestForm`, `OtherMumukshuForm`, `CustomChipGroup`, `CustomSelectBottomSheet`, `FormField`, `CustomButton`, `CustomAlert`, `HorizontalSeparator`.
- Commit after each task.

## Verified backend contract (`/api/v1`, behind `validateCard`)
| Call | Method+endpoint | Request | Response |
|---|---|---|---|
| adhyayan detail | `GET /adhyayan/:id` | query `{ cardno }` | `{ data: Adhyayan }` |
| utsav detail | `GET /utsav/:id` | query `{ cardno }` | `{ data: Utsav }` (single object; `packages` may be missing → `[]`) |
| create guests | `POST /guest` | body `{ cardno, guests }` | `{ guests: [...] }` (NOTE: field is `guests`, not `data`) |
| adhyayan fb validate | `GET /adhyayan/feedback/validate` | query `{ shibir_id, cardno }` | `{ message }` or throws (already-submitted / not-allowed / not-completed) |
| adhyayan fb submit | `POST /adhyayan/feedback` | body `{ cardno, shibir_id, ...flatAnswersByQuestionId }` | `201 { ... }` |
| utsav fb validate | `GET /utsav/feedback/validate` | query `{ utsav_id, cardno }` | `{ success, message }` or throws |
| utsav fb submit | `POST /utsav/feedback` | body `{ cardno, utsav_id, answers: [{ question_id, question_text, question_type, answer }] }` | `201 { ... }` |

- `Adhyayan` (ShibirDb): `id:number, name, speaker, month, start_date, end_date, location, total_seats, available_seats, food_allowed:boolean, amount:number, comments:string|null, status:'open'|'closed'|'deleted'`.
- `Utsav`: `utsav_id, utsav_name, utsav_start, utsav_end, utsav_month, utsav_location, utsav_status, registration_deadline, packages: UtsavPackage[]`; `UtsavPackage`: `package_id, package_name, package_start, package_end, package_amount`.
- Adhyayan feedback body is FLAT (keys = `ADHYAYAN_QUESTIONS` ids); utsav feedback body is an `answers[]` ARRAY (server allowlist `ALLOWED_UTSAV_FEEDBACK_QUESTIONS` must stay in sync with `UTSAV_QUESTIONS`). Preserve both shapes exactly.

## Target structure
```
src/features/events/
  screens/ AdhyayanDetailScreen, UtsavDetailScreen, AdhyayanFeedbackScreen,
           UtsavFeedbackScreen, UtsavDailyScheduleScreen, UtsavGuidelinesScreen
  components/ (only clearly-safe presentational sections extracted from the god files)
  questions/ adhyayanFeedback.ts, utsavFeedback.ts   (moved from src/questions)
  api.ts    (detail queries + feedback validate/submit + createGuests, over apiClient)
  types.ts  (Adhyayan, Utsav, UtsavPackage, feedback payloads)
  index.ts  (barrel: the 6 screens)
```

---

## Task 1: `types.ts` + `api.ts`
**Files:** create `src/features/events/types.ts`, `src/features/events/api.ts`.

- [ ] **Step 1:** Create `types.ts` with `Adhyayan`, `Utsav`, `UtsavPackage`, `AdhyayanStatus = 'open'|'closed'|'deleted'`, and feedback payload types. Base `Utsav`/`UtsavPackage` on the inline types already in `utsav/[id].tsx` (read them) — align field names to the backend contract above.
- [ ] **Step 2:** Create `api.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Adhyayan, Utsav } from './types';

interface Envelope<T> { data: T; message?: string; }

export const eventKeys = {
  adhyayan: (id: string, cardno: string) => ['adhyayan', id, cardno],
  // PRESERVE the original (unusual) utsav key so cache behavior is unchanged.
  utsav: (id: string, cardno: string) => ['utsavdeeplink', id, cardno],
};

export function useAdhyayanDetail(id: string, cardno: string) {
  return useQuery<Adhyayan>({
    queryKey: eventKeys.adhyayan(id, cardno),
    queryFn: async () => {
      const res = await apiClient.get<Envelope<Adhyayan>>(`/adhyayan/${id}`, { params: { cardno } });
      return res.data;
    },
    enabled: !!id && !!cardno,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
}

export function useUtsavDetail(id: string, cardno: string) {
  return useQuery<Utsav>({
    queryKey: eventKeys.utsav(id, cardno),
    queryFn: async () => {
      const res = await apiClient.get<Envelope<Utsav>>(`/utsav/${id}`, { params: { cardno } });
      const u = res.data;
      return { ...u, packages: Array.isArray(u?.packages) ? u.packages : [] };
    },
    enabled: !!id && !!cardno,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 5,
  });
}

// Shared guest-creation endpoint used by the event register flow. Response field
// is `guests` (not `data`). Returns the created guests array.
export function createGuests(cardno: string, guests: unknown[]) {
  return apiClient
    .post<{ guests: unknown[] }>('/guest', { cardno, guests })
    .then((r) => r.guests);
}

export function validateAdhyayanFeedback(shibir_id: string, cardno: string) {
  return apiClient.get('/adhyayan/feedback/validate', { params: { shibir_id, cardno }, allowToast: false });
}
export function submitAdhyayanFeedback(cardno: string, shibir_id: string, answers: Record<string, unknown>) {
  return apiClient.post('/adhyayan/feedback', { cardno, shibir_id, ...answers });
}
export function validateUtsavFeedback(utsav_id: string, cardno: string) {
  return apiClient.get('/utsav/feedback/validate', { params: { utsav_id, cardno }, allowToast: false });
}
export function submitUtsavFeedback(
  cardno: string,
  utsav_id: string,
  answers: { question_id: string; question_text: string; question_type: string; answer: unknown }[]
) {
  return apiClient.post('/utsav/feedback', { cardno, utsav_id, answers });
}
```
Read the original screens to confirm the exact RQ keys/options, the `/guest` response field, feedback `allowToast` usage, and the exact validate/submit request shapes — match them.

- [ ] **Step 3:** lint 0; typecheck ≤ 84. Commit `feat(events): types + api (detail queries, feedback, guests)`.

---

## Task 2: Utsav static screens (dailySchedule, guidelines)
**Files:** create `src/features/events/screens/UtsavDailyScheduleScreen.tsx`, `UtsavGuidelinesScreen.tsx`; barrel; thin `src/app/utsav/dailySchedule.tsx`, `src/app/utsav/utsavGuidelines.tsx`.

- [ ] **Step 1:** Move both static screens verbatim into the feature; create `src/features/events/index.ts` exporting them; thin the two route files via the barrel. No logic change.
- [ ] **Step 2:** lint 0; typecheck ≤ 84. Commit `refactor(events): move utsav static screens into feature`.

---

## Task 3: Feedback screens (adhyayan + utsav) + questions
**Files:** move `src/questions/adhyayanFeedback.ts` + `utsavFeedback.ts` → `src/features/events/questions/`; create `src/features/events/screens/AdhyayanFeedbackScreen.tsx`, `UtsavFeedbackScreen.tsx`; add to barrel; thin `src/app/adhyayan/feedback/[id].tsx`, `src/app/utsav/feedback/[id].tsx`; delete old question files.

- [ ] **Step 1:** Move the two `questions/*.ts` into `features/events/questions/` verbatim; update importers.
- [ ] **Step 2:** Move each feedback screen into the feature. Keep rendering the SHARED `SteppedFeedback` (`@/components/SteppedFeedback`). Replace inline `handleAPICall` with `validateAdhyayanFeedback`/`submitAdhyayanFeedback` (or utsav variants) from `../api`. **Preserve the exact answer-mapping** each screen builds from SteppedFeedback output (adhyayan → flat body; utsav → `answers[]` array) and the exact query invalidations (`['adhyayanBooking', cardno]` / `['utsavBooking', cardno]`). Type answers minimally; don't change the submitted shapes.
- [ ] **Step 3:** Add both feedback screens to the barrel; thin the two route files. Delete old `src/questions/*` files; fix any importers.
- [ ] **Step 4:** lint 0; typecheck ≤ 84. Commit `refactor(events): feedback screens + questions into feature`.

---

## Task 4: Adhyayan detail screen (god-file split)
**Files:** create `src/features/events/screens/AdhyayanDetailScreen.tsx` (+ safe presentational sections in `components/`); barrel; thin `src/app/adhyayan/[id].tsx`.

- [ ] **Step 1:** Read `src/app/adhyayan/[id].tsx` FULLY. Create `AdhyayanDetailScreen.tsx` (default export). Swap the detail fetch to `useAdhyayanDetail(id, cardno)`; swap the guest-create call to `createGuests(cardno, guests)`. Type `adhyayan` as `Adhyayan`.
- [ ] **Step 2 — 🔴 preserve the booking hand-off VERBATIM:** keep `handleBookingConfirm` and the Self/Guest/Mumukshu branches exactly as-is, including the EXACT objects passed to `updateGuestBooking('adhyayan', …)` / `updateMumukshuBooking('adhyayan', …)` and the self-booking store writes, and the `router.push` targets (`/booking/…` incl. the `location === 'Research Centre'` → `types.ADHYAYAN_DETAILS_TYPE` branch). Do not rename any field in those objects. `as any` at the store call is fine.
- [ ] **Step 3 — safe extraction only:** extract clearly presentational sections into `components/` (props in, JSX out, no store/booking logic): e.g. `EventDetailHeader` (back/share bar), `EventHeroInfo`, `EventKeyDetails` (date/location/food/availability cards), `EventThingsToKnow`. Keep the register modal + chip selector + guest/mumukshu forms + `handleBookingConfirm` INLINE (they touch the store-push contract). Don't extract anything that would thread store/booking state through props.
- [ ] **Step 4:** barrel add; thin `src/app/adhyayan/[id].tsx`. Verify `grep -rn "handleAPICall\|HandleApiCall" src/features/events` → 0; lint 0; typecheck ≤ 84; bundle exit 0. Commit `refactor(events): adhyayan detail screen into feature (split sections)`.

---

## Task 5: Utsav detail screen (god-file split — largest)
**Files:** create `src/features/events/screens/UtsavDetailScreen.tsx` (reuse the Task-4 section components where identical; add `EventPackageSelector` for the utsav-only package/arrival/volunteer/other block); barrel; thin `src/app/utsav/[id].tsx`.

- [ ] **Step 1:** Read `src/app/utsav/[id].tsx` FULLY. Create `UtsavDetailScreen.tsx` (default export). Swap detail fetch to `useUtsavDetail(id, cardno)`; guest-create to `createGuests`. Type `utsav`/`packages` with `Utsav`/`UtsavPackage`.
- [ ] **Step 2 — 🔴 preserve the booking hand-off VERBATIM:** same rule as Task 4 — the exact objects pushed to `updateGuestBooking('utsav', …)` / `updateMumukshuBooking('utsav', …)` and the self-utsav store writes (`package`, `arrival`, `volunteer`, `carno`, `other`) and `router.push` targets (incl. `location === 'Research Centre'` → `types.EVENT_DETAILS_TYPE`) must be byte-identical. `preparingRequestBody.js` depends on this shape.
- [ ] **Step 3 — safe extraction:** reuse `EventDetailHeader`/`EventHeroInfo`/`EventKeyDetails`/`EventThingsToKnow` from Task 4 where they fit; extract the utsav self/guest/mumukshu package+arrival+volunteer+other block (currently triplicated inline) into a presentational `EventPackageSelector` ONLY IF it can take plain value+onChange props without owning store logic — otherwise leave inline. Keep the register modal + `handleBookingConfirm` inline.
- [ ] **Step 4:** barrel add; thin `src/app/utsav/[id].tsx`. Verify grep handleAPICall → 0; lint 0; typecheck ≤ 84; bundle exit 0. Commit `refactor(events): utsav detail screen into feature (split sections)`.

---

## Task 6: Barrel finalize + route sweep + gates
**Files:** finalize `src/features/events/index.ts`; verify all route files.

- [ ] **Step 1:** `index.ts` exports the 6 screens (named). Confirm every route file (`adhyayan/[id]`, `adhyayan/feedback/[id]`, `utsav/[id]`, `utsav/feedback/[id]`, `utsav/dailySchedule`, `utsav/utsavGuidelines`) is a one-line re-export via `@/features/events`; `_layout.tsx` files unchanged.
- [ ] **Step 2:** Verify: no `handleAPICall`/`axios` in `features/events`; no stale imports of moved `questions/*`; booking domain files untouched (`git status` shows no changes under `components/booking*`, `stores/useBookingStore.js`, `utils/preparingRequestBody.js`).
- [ ] **Step 3:** Final gates: lint 0; typecheck ≤ 84; `expo export` exit 0. Commit `refactor(events): barrel + thin routes; feature self-contained`.

---

## Completion Gate
- [ ] lint 0; typecheck ≤ 84; `expo export` exit 0.
- [ ] All 6 event route files are thin re-exports; `_layout`s unchanged; feedback route paths unchanged (booking cancellation deep-links still resolve).
- [ ] No `handleAPICall`/`axios` in `features/events`.
- [ ] Booking domain untouched (store, preparingRequestBody, booking components, book-now).
- [ ] Smoke-test (critical — store-shape coupling): open an adhyayan, register Self at a non-RC location → reaches booking review → **submit succeeds** (proves preparingRequestBody still reads the pushed shape); register Guest/Mumukshu; same for utsav incl. package selection + RC-location branch; submit adhyayan + utsav feedback; utsav daily schedule + guidelines render.

## Out of scope (flag)
- De-duplicating `AdhyayanBooking.tsx`/`EventsBooking.tsx` (book-now hub) against the detail screens — booking-domain concern, revisit in the booking migration.
- Normalizing the hard-coded `'Research Centre'` location string to a shared constant.
- Typing `useBookingStore` (booking domain, later) — until then the store push is `any` at the boundary.

## Self-Review (author checklist — completed)
- **Spec coverage:** single events feature (screens/components/api/types/questions), thin barrel routes, RQ hooks over apiClient, backend-accurate types replacing `any`, god-file splits (presentational only). ✓
- **#1 risk contained:** store-push shape + router.push targets preserved verbatim in Tasks 4/5; smoke-test explicitly exercises a real booking submit to prove `preparingRequestBody` still works. ✓
- **Boundary respected:** booking store/components/preparingRequestBody/book-now explicitly not touched; SteppedFeedback + generic forms stay shared; feedback route paths preserved for booking's deep-links. ✓
- **Type consistency:** `eventKeys`/`useAdhyayanDetail`/`useUtsavDetail`/`createGuests`/feedback fn names consistent across api.ts (Task 1) and screens (Tasks 3–5); `Adhyayan`/`Utsav`/`UtsavPackage` single-sourced.
- **Parity:** RQ keys (incl. the `utsavdeeplink` key) + stale/gc times preserved; feedback flat-vs-array bodies preserved; invalidations preserved.
