# Phase 4 (part 1) — Migrate auth/onboarding + eliminate `handleAPICall`

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development / executing-plans. Steps use `- [ ]`.

**Goal:** Migrate the last route groups (`(auth)`, `(onboarding)`) into features, swap the remaining shared components/hooks off the legacy `handleAPICall` shim to `apiClient`, then **delete `src/utils/HandleApiCall.js`**. ZERO user-visible behavior change.

## The 8 remaining `handleAPICall` call sites (all must be converted before the shim can be deleted)
1. `src/app/(auth)/sign-in.tsx` — `POST /client/verifyAndLogin` {mobno,password,token}, `POST /client/forgotPassword` {mobno}
2. `src/app/(onboarding)/completeProfile.tsx` — `PUT /profile`, `GET /client/logout`
3. `src/app/(onboarding)/imageCapture.tsx` — `GET /client/logout`
4. `src/components/ProfileForm.tsx` — `GET /location/countries|states/:c|cities/:c/:s|centres` (4, inside useQuery)
5. `src/hooks/useQuickImagePicker.ts` — `POST /profile/upload` (multipart via `body.image`)
6. `src/hooks/useUtsavDate.ts` — `GET /travel/events` (inside useQuery)
7. `src/components/GuestForm.tsx` — `GET /guest/check/:mobno`
8. `src/components/OtherMumukshuForm.tsx` — `GET /mumukshu` {cardno,mobno}

## Global Constraints
- No behavior change. **Lint:** 0 problems. **Typecheck:** `npx tsc --noEmit --pretty false 2>&1 | grep -c "error TS"` ≤ 84 (currently 37 — do not regress; prefer to reduce). **Bundle:** on the auth/onboarding tasks + final: `npx expo export --platform android` exit 0.
- 🔴 **`setUser` envelope fidelity:** `apiClient.get/post` returns the response BODY (`{message, data}`). Current code did `successCallback(body)` then `setUser(body.data)` / read `body.data`. So converted code MUST read `.data` off the apiClient result (e.g. `const res = await apiClient.post(...); setUser(res.data)`). Do NOT double-unwrap or drop `.data`.
- 🔴 **cardno + push token:** every call must still pass `cardno` the same way (query param vs body) — `validateCard` 404s otherwise. Login must still forward the expo push `token`.
- 🔴 **multipart:** `useQuickImagePicker` upload passes `{ image: uri }` as the body + `{ cardno }` as params; `apiClient` already handles the `body.image`→FormData special case. Read the new pfp URL from `res.data`.
- Shared components/hooks (`ProfileForm`, `useQuickImagePicker`, `useUtsavDate`, `GuestForm`, `OtherMumukshuForm`) STAY at their current paths (consumed by already-migrated profile/booking/events) — only swap their transport.
- Commit after each task.

## Backend contract (verified)
- `POST /client/verifyAndLogin` {mobno,password,token} → `{message:'logged in', data: user(+isFlatOwner)}`
- `POST /client/forgotPassword` {mobno} → `{message, data:{email}}`
- `GET /client/logout` ?cardno → `{message:'logged out'}`
- `PUT /profile` {cardno,...form} → `{message, data:user}` (reuse `features/profile/api.ts::updateProfile`)
- `POST /profile/upload` ?cardno + multipart image → `{data: url}`
- `GET /location/countries|states/:country|cities/:country/:state|centres` → `{message, data:[{key,value}]}`
- `GET /travel/events` ?cardno → `{message, data: Utsav[]}`
- `GET /guest/check/:mobno` ?cardno → `{data}` or new-guest branch
- `GET /mumukshu` ?cardno&mobno → `{data}`

---

## Task 1: `features/auth` (sign-in)
**Files:** create `src/features/auth/screens/SignInScreen.tsx`, `src/features/auth/api.ts`, `src/features/auth/index.ts`; thin `src/app/(auth)/sign-in.tsx`.
- [ ] `api.ts`: `login(mobno, password, token)` → `apiClient.post('/client/verifyAndLogin', {mobno, password, token})`; `forgotPassword(mobno)` → `apiClient.post('/client/forgotPassword', {mobno})`. Return the response body (caller reads `.data`).
- [ ] Move `sign-in.tsx` body → `SignInScreen.tsx` (keep local `PasswordResetModal`, keyboard animation, state). Swap the 2 `handleAPICall`s to `login`/`forgotPassword`; `setUser(res.data)` on login; read `res.data.email` for the reset modal. Keep forwarding the expo push `token` from `useNotification()`.
- [ ] Barrel exports `SignInScreen`; route `(auth)/sign-in.tsx` → `import { SignInScreen } from '@/features/auth'; export default SignInScreen;`. `_layout.tsx` stays.
- [ ] lint 0; typecheck ≤84; bundle 0. Commit `refactor(auth): sign-in into feature, apiClient`.

## Task 2: `features/onboarding` (completeProfile, imageCapture)
**Files:** create `src/features/onboarding/screens/{CompleteProfileScreen,ImageCaptureScreen}.tsx`, `src/features/onboarding/index.ts`; thin `src/app/(onboarding)/{completeProfile,imageCapture}.tsx`.
- [ ] `CompleteProfileScreen`: renders shared `@/components/ProfileForm`; on submit call `updateProfile(cardno, formData)` from `@/features/profile/api.ts` (reuse — import via `@/features/profile` barrel; add `updateProfile`/`logoutRequest` to that barrel if not exported), then `setUser(result)`; the logout row calls `logoutRequest(cardno)` then `logout()`. No `handleAPICall`.
- [ ] `ImageCaptureScreen`: uses shared `useQuickImagePicker`; its logout row calls `logoutRequest(cardno)` then `logout()`.
- [ ] Barrel; thin both route files; `_layout.tsx` stays.
- [ ] Verify onboarding guards still work (setUser shape unchanged). lint 0; typecheck ≤84; bundle 0. Commit `refactor(onboarding): screens into feature, apiClient`.

## Task 3: Swap transport in the 5 shared files
**Files:** `src/components/ProfileForm.tsx`, `src/hooks/useQuickImagePicker.ts`, `src/hooks/useUtsavDate.ts`, `src/components/GuestForm.tsx`, `src/components/OtherMumukshuForm.tsx`.
- [ ] ProfileForm: replace the 4 `handleAPICall`+`new Promise` location fetches with `apiClient.get('/location/...')` as the `useQuery` queryFn (drop the manual Promise). Keep query keys/enabled exactly.
- [ ] useQuickImagePicker: `apiClient.post('/profile/upload', { image: uri }, { params: { cardno } })`; read new pfp URL from `res.data`; keep progress/cache-invalidation/setUser behavior identical.
- [ ] useUtsavDate: `apiClient.get('/travel/events', { params: { cardno } })` as the `useQuery` queryFn; keep key `['travel-events', cardno]` + staleTime.
- [ ] GuestForm: `apiClient.get('/guest/check/'+mobno, { params: { cardno } })`; preserve the new-guest branch semantics (resolve `{data}` vs `{isNewGuest:true}`) exactly.
- [ ] OtherMumukshuForm: `apiClient.get('/mumukshu', { params: { cardno, mobno } })`; preserve resolve/reject semantics.
- [ ] These are shared by profile/booking/events — verify those still compile/behave. lint 0; typecheck ≤84. Commit `refactor(api): swap shared components/hooks off handleAPICall to apiClient`.

## Task 4: Delete the shim + finalize
- [ ] Re-grep `grep -rn "HandleApiCall\|handleAPICall" src` → confirm ONLY the shim file + the `resolveBaseUrl.ts` comment + any code comments remain (0 real importers). Delete `src/utils/HandleApiCall.js`. Update the `resolveBaseUrl.ts` comment to drop the `HandleApiCall.js` mention. Remove/adjust any now-stale code comments referencing it.
- [ ] Verify: `grep -rn "from '@/utils/HandleApiCall'" src` → 0. lint 0; typecheck ≤84; bundle exit 0.
- [ ] Commit `chore(api): delete legacy handleAPICall shim (all call sites on apiClient)`.

## Completion Gate
- [ ] `src/utils/HandleApiCall.js` deleted; 0 importers of it.
- [ ] auth + onboarding are features with thin routes; shared ProfileForm/useQuickImagePicker/GuestForm/OtherMumukshuForm/useUtsavDate on `apiClient`.
- [ ] lint 0; typecheck ≤ 84; bundle exit 0.
- [ ] Smoke-test: login, forgot-password, onboarding (image capture + complete profile), logout, profile-edit + pfp upload from profile tab, a guest/mumukshu add in booking, a travel date-in-utsav check.

## Self-Review (author checklist — completed)
- All 8 handleAPICall sites enumerated with exact endpoints → shim deletable after Tasks 1–3. ✓
- Envelope/`.data`, cardno, push-token, multipart fidelity flagged. ✓
- Shared files stay put (only transport swapped); onboarding reuses profile's updateProfile/logoutRequest. ✓
