# Phase 3 (Domain 3) — Profile Feature Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development / executing-plans. Steps use `- [ ]`.

**Goal:** Migrate the profile domain (main profile screen, edit-profile, transactions) into `src/features/profile/` following the established template, split the 743-line `profile.tsx` god file into composed sections, route profile REST through typed `api.ts`, and add real `Profile`/`Transaction` types (all `any` today). ZERO user-visible behavior change.

**Architecture:** Single `features/profile/` with three screens + extracted section components + `api.ts` + `types.ts` + barrel. Route files `(tabs)/profile.tsx`, `profile/profileDetails.tsx`, `profile/transactions.tsx` become thin re-exports via the barrel; `profile/_layout.tsx` stays. Because `user` lives in Zustand (untyped JS store), profile screens keep their imperative `fetch → setUser` pattern — so `api.ts` exposes plain `apiClient` functions for those (not query hooks), plus a real infinite-query hook for transactions.

**Tech Stack:** RN 0.79 / Expo SDK 56, Expo Router 6, TS, NativeWind, TanStack React Query v5, `apiClient`, Zustand.

## Global Constraints
- No user-visible behavior change.
- **Lint gate:** `npm run lint` 0 problems each task. **Typecheck gate:** `npx tsc --noEmit --pretty false 2>&1 | grep -c "error TS"` MUST stay ≤ 84 (currently 81 — don't regress; prefer to reduce).
- **Bundle gate (profile-split task + final):** `npx expo export --platform android --output-dir /tmp/p3p-export` exits 0; delete after.
- Feature code uses `features/profile/api.ts` or `apiClient` — never `axios`/`handleAPICall`.
- Route files import screens via the `@/features/profile` BARREL, never deep `@/features/*/*`.
- No `export *`.
- **Do NOT move (shared — leave in place):** `src/components/ProfileForm.tsx` (also used by onboarding `completeProfile.tsx`), `src/hooks/useQuickImagePicker.ts` (also onboarding), `src/components/QrModal.tsx` (tab-bar chrome), `src/constants/dropdowns.js`, `src/utils/imageCache.ts`, and all generic `@/components/*`.
- **Do NOT touch (out of scope):** `src/app/(onboarding)/completeProfile.tsx`, `src/app/(home)/pendingPayments.tsx` (they share the `/profile` PUT and `/profile/transactions` endpoints but belong to other domains — leave their current `handleAPICall` usage as-is). `src/app/profile/qr.tsx` (appears to be a dead/unreachable route — leave it, flag it; do NOT migrate or delete).
- `user` from the untyped Zustand store may be cast at the boundary (`useAuthStore((s) => s.user) as Profile | null`) — do not convert `useAuthStore` to TS here.
- Commit after each task.

## Verified backend contract (`/api/v1`, behind `validateCard`)
| Call | Method+endpoint | Request | Response |
|---|---|---|---|
| get profile | `GET /profile` | query `{ cardno }` | `{ message, data: Profile }` (CardDb row + `isFlatOwner`) |
| update profile | `PUT /profile` | body `{ cardno, ...ProfileFormData }` | `{ message, data: Profile }` |
| pfp upload | `POST /profile/upload` | `{ cardno }` params + multipart `image` | `{ message, data: string(url) }` (handled by shared `useQuickImagePicker` — NOT re-implemented here) |
| transactions | `GET /profile/transactions` | query `{ cardno, page, status }` | `{ message, data: Transaction[], pagination: { page, pageSize, hasMore } }` |
| update password | `POST /client/updatePassword` | body `{ cardno, current_password, new_password }` | `{ message, data }` |
| logout | `GET /client/logout` | query `{ cardno }` | `{ message }` |

- `Profile` fields (CardDb): `cardno, issuedto, gender('M'|'F'), dob, idType, idNo, address, mobno, email, country, state, city, pin, center, pfp, credits:{room,travel,food,utsav}, res_status, status, isFlatOwner, showDevelopmentDashboard`.
- `Transaction` fields: `bookingid, amount, category, status, discount, description, createdAt, booked_for, booked_by, start_day, end_day, name, booked_for_name`.
- Transactions list currently uses the empty-page heuristic for pagination; PRESERVE that (do not switch to `pagination.hasMore` — behavior change).

---

## Task 1: `types.ts` + `api.ts`
**Files:** create `src/features/profile/types.ts`, `src/features/profile/api.ts`.

- [ ] **Step 1:** Create `types.ts`:
```ts
export type Gender = 'M' | 'F';

export interface ProfileCredits { room?: number; travel?: number; food?: number; utsav?: number; }

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

// Body accepted by PUT /profile (mirrors ProfileForm's ProfileFormData).
export type ProfileFormData = Pick<
  Profile,
  'issuedto' | 'gender' | 'dob' | 'address' | 'mobno' | 'idType' | 'idNo' | 'email'
  | 'country' | 'state' | 'city' | 'pin' | 'center'
>;

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
```
(Confirm `ProfileFormData` fields against the exact interface exported by `src/components/ProfileForm.tsx`; match it.)

- [ ] **Step 2:** Create `api.ts`. Transactions is a real infinite-query hook; the store-centric calls are plain functions (the screens call them then `setUser`, preserving today's imperative pattern):
```ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Profile, ProfileFormData, Transaction } from './types';

interface Envelope<T> { message?: string; data: T; }

export const profileKeys = {
  transactions: (cardno: string, status: string) => ['transactions', cardno, status],
};

export function fetchProfile(cardno: string) {
  return apiClient
    .get<Envelope<Profile>>('/profile', { params: { cardno } })
    .then((r) => r.data);
}

export function updateProfile(cardno: string, form: ProfileFormData) {
  return apiClient
    .put<Envelope<Profile>>('/profile', { cardno, ...form })
    .then((r) => r.data);
}

export function updatePassword(cardno: string, current_password: string, new_password: string) {
  return apiClient.post('/client/updatePassword', { cardno, current_password, new_password });
}

export function logoutRequest(cardno: string) {
  return apiClient.get('/client/logout', { params: { cardno } });
}

export function useTransactions(cardno: string, status: string) {
  return useInfiniteQuery({
    queryKey: profileKeys.transactions(cardno, status),
    queryFn: async ({ pageParam = 1 }) => {
      const res = await apiClient.get<Envelope<Transaction[]>>('/profile/transactions', {
        params: { cardno, page: pageParam, status },
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    initialPageParam: 1,
    // Preserve the original empty-page heuristic (NOT pagination.hasMore).
    getNextPageParam: (lastPage, pages) =>
      !lastPage || lastPage.length === 0 ? undefined : pages.length + 1,
    enabled: !!cardno,
    staleTime: 1000 * 60 * 30,
  });
}
```
(Read the original `transactions.tsx` and match its `status` param default (`'all'`) + `getNextPageParam` + `staleTime` exactly.)

- [ ] **Step 3:** lint 0; typecheck ≤ 84. Commit `feat(profile): types + api (profile/transactions/password/logout)`.

---

## Task 2: Transactions screen (split list + item)
**Files:** create `src/features/profile/screens/TransactionsScreen.tsx`, `src/features/profile/components/TransactionItem.tsx`.

- [ ] **Step 1:** Read `src/app/profile/transactions.tsx`. Move the list responsibility → `TransactionsScreen.tsx` (default export): chip filter, `useTransactions(cardno, selectedChip)`, infinite scroll, refresh, empty/loading. Extract the `TransactionItem` renderer (category/status/date formatting) → `components/TransactionItem.tsx` typed with `Transaction`. No behavior change.
- [ ] **Step 2:** lint 0; typecheck ≤ 84. Commit `refactor(profile): transactions screen into feature (typed, split item)`.

---

## Task 3: Profile details (edit) screen
**Files:** create `src/features/profile/screens/ProfileDetailsScreen.tsx`.

- [ ] **Step 1:** Read `src/app/profile/profileDetails.tsx`. Move → `ProfileDetailsScreen.tsx` (default export). It renders the SHARED `ProfileForm` (import from `@/components/ProfileForm` — do NOT move ProfileForm). Replace its inline `PUT /profile` (`handleAPICall`) with `await updateProfile(cardno, formData)` from `../api`, then `setUser(result)` exactly as before. Preserve the initial-form mapping + success navigation.
- [ ] **Step 2:** lint 0; typecheck ≤ 84. Commit `refactor(profile): edit-profile screen into feature`.

---

## Task 4: Profile home screen (god-file split)
**Files:** create `src/features/profile/screens/ProfileScreen.tsx` + `components/{ProfileHeader,ProfileMenuList,ResetPasswordModal,CreditsInfoModal}.tsx`.

- [ ] **Step 1:** Read `src/app/(tabs)/profile.tsx` fully. Create `ProfileScreen.tsx` (default export) as the shell: holds `refreshUserData` (calls `fetchProfile(cardno)` from `../api` then `setUser`), pull-to-refresh, `handleLogout` (calls `logoutRequest(cardno)` then `logout()`), and composes the sections below. Cast `user` from the store as `Profile` at the boundary.
- [ ] **Step 2:** Extract as pure/cohesive components under `components/`:
  - `ProfileHeader.tsx` — avatar/pfp (uses shared `useQuickImagePicker` + `imageCache` utils, kept via `@/hooks`/`@/utils`), credits summary. Props: the `user`/`profile` data + upload handlers it needs.
  - `ProfileMenuList.tsx` — the `profileList` menu config + `renderMenuItem`, including the dev-backend toggle (`useDevStore`) + PR-number input (keep dev-tools here; gated by `showDevelopmentDashboard` as today).
  - `ResetPasswordModal.tsx` — the password modal + keyboard-offset animation + submit (calls `updatePassword(cardno, ...)` from `../api`). Props `{ visible, onClose }`.
  - `CreditsInfoModal.tsx` — static credits explainer. Props `{ visible, onClose }`.
  Preserve ALL behavior: image cache-busting `useFocusEffect`, reset-password validation/flow, logout, dev toggle + `expo-updates` reload, credits display.
- [ ] **Step 3:** Verify `grep -rn "handleAPICall\|HandleApiCall" src/features/profile` → 0; lint 0; typecheck ≤ 84; **bundle gate** exit 0. Commit `refactor(profile): split profile home into screen + sections`.

---

## Task 5: Barrel + thin routes + gates
**Files:** create `src/features/profile/index.ts`; modify `src/app/(tabs)/profile.tsx`, `src/app/profile/profileDetails.tsx`, `src/app/profile/transactions.tsx`.

- [ ] **Step 1:** `index.ts`:
```ts
export { default as ProfileScreen } from './screens/ProfileScreen';
export { default as ProfileDetailsScreen } from './screens/ProfileDetailsScreen';
export { default as TransactionsScreen } from './screens/TransactionsScreen';
```
- [ ] **Step 2:** Thin the 3 route files (keep `profile/_layout.tsx`):
  - `(tabs)/profile.tsx`: `import { ProfileScreen } from '@/features/profile'; export default ProfileScreen;`
  - `profile/profileDetails.tsx`: `import { ProfileDetailsScreen } from '@/features/profile'; export default ProfileDetailsScreen;`
  - `profile/transactions.tsx`: `import { TransactionsScreen } from '@/features/profile'; export default TransactionsScreen;`
- [ ] **Step 3:** Verify: no stale imports; no `handleAPICall` in feature; `(tabs)/profile.tsx` still a valid tab screen (default export). lint 0; typecheck ≤ 84; bundle exit 0.
- [ ] **Step 4:** Commit `refactor(profile): barrel + thin route re-exports`.

---

## Completion Gate
- [ ] lint 0; typecheck ≤ 84; `expo export` exit 0.
- [ ] The 3 route files are one-line re-exports; `profile/_layout.tsx` unchanged; `ProfileForm`/`useQuickImagePicker`/`QrModal`/`dropdowns`/`imageCache` untouched in place; onboarding + pendingPayments untouched.
- [ ] No `handleAPICall`/`axios` in `features/profile`.
- [ ] Smoke-test: profile tab loads (avatar, credits), pull-to-refresh, edit profile → save, reset password, transactions list + filter, logout, pfp upload.

## Out of scope (flag)
- `src/app/profile/qr.tsx` appears unreachable — left untouched, confirm with team before delete.
- Converting `useAuthStore` to TS with a real `Profile` type (broader; casting at boundary for now).
- De-duplicating the `/profile` PUT + logout shared with onboarding, and the `/profile/transactions` query shared with pendingPayments (cross-domain; revisit when those domains migrate).

## Self-Review (author checklist — completed)
- **Spec coverage:** feature-folder (screens/components/api/types), thin barrel routes, RQ hook for transactions + plain apiClient fns preserving the imperative store pattern, backend-accurate types replacing `any`, god-file split. ✓
- **Shared-code safety:** ProfileForm/useQuickImagePicker/QrModal/dropdowns/imageCache explicitly NOT moved; onboarding/pendingPayments explicitly not touched. ✓
- **Parity:** transactions `getNextPageParam` empty-page heuristic + staleTime preserved; imperative fetch→setUser preserved; pfp cache-busting preserved. ✓
- **Type consistency:** `fetchProfile`/`updateProfile`/`updatePassword`/`logoutRequest`/`useTransactions`/`profileKeys` names consistent across api.ts (Task 1) and screens (Tasks 2–4); `Profile`/`ProfileFormData`/`Transaction` single-sourced.
