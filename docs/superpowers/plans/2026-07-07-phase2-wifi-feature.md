# Phase 2 — WiFi Feature Migration (template) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Migrate the WiFi feature into a self-contained `src/features/wifi/` (screen + components + React Query `api.ts` + backend-accurate `types.ts`), reduce the Expo Router route file to a thin re-export, and route all WiFi network access through the `apiClient` — with zero user-visible behavior change. This becomes the reference template every other domain copies in Phase 3.

**Architecture:** `src/app/(home)/wifi.tsx` stays only as a thin route that re-exports `features/wifi/screens/WifiScreen`. Real code lives in `features/wifi/`. Network calls move from direct `handleAPICall` into typed React Query hooks in `features/wifi/api.ts` built on `@/lib/api/client`. `wifiCache` (shared with auth logout) moves to `@/lib/wifiCache` so both the feature and `useAuthStore` import it without crossing a feature boundary.

**Tech Stack:** React Native 0.79 / Expo SDK 56, Expo Router 6, TypeScript, NativeWind, Zustand + MMKV, TanStack React Query v5, axios (via `apiClient`), Sentry.

## Global Constraints

- No user-visible behavior change — the WiFi screen must look and behave identically.
- **Lint gate:** `npm run lint` MUST be at **0 problems** at the end of every task.
- **Typecheck gate:** `npx tsc --noEmit --pretty false 2>&1 | grep -c "error TS"` MUST NOT exceed the pre-existing baseline of **84** (always use `--pretty false`). Prefer to REDUCE it by typing WiFi correctly, but never increase it.
- **Bundle gate (final task only):** `npx expo export --platform android --output-dir /tmp/p2-export` MUST exit 0 (whole app still bundles). Delete the output dir after.
- Data access rule: WiFi components/screens call hooks from `features/wifi/api.ts` — never `axios`, never `handleAPICall` directly. (The ESLint boundary already blocks direct `axios`.)
- No `export *` barrels; `features/wifi/index.ts` (if created) uses explicit named exports only.
- React Query v5: `useQuery` has NO `onSuccess`. Do cache-writes inside the `queryFn`.
- Commit after every task with a conventional-commit message.

## Backend contract (verified against `aashray-backend` controllers/models — the source of truth)

Base path `/api/v1/wifi`, all behind `validateCard` (reads `cardno` from query/body).

| Call | Method + endpoint | Request | Response body |
|---|---|---|---|
| temp codes | `GET /wifi` | query `{ cardno }` | `{ message, data: TempWifiCode[] }` (empty array if ineligible; field is `createdAt`, camelCase) |
| permanent status | `GET /wifi/permanent` | query `{ cardno }` | `{ message, data: PermanentWifiCode[] }` (excludes `deleted`) |
| generate temp | `GET /wifi/generate` | query `{ cardno }` | `{ message, data: string }` (`data` is the password STRING; caller ignores it) |
| request permanent | `POST /wifi/permanent` | body `{ cardno, deviceType }` | `{ message }` (NO `data`) |
| reset permanent | `POST /wifi/permanent/reset` | body `{ id, cardno }` | `{ message }` (NO `data`) |

`PermanentWifiCode.id` is a numeric PK (JSON number). `status` ∈ `'pending' | 'approved' | 'rejected' | 'reset'` on the client. `MAX_WIFI_PASS_LIMIT = 1`. Residents/Seva-Kutir (`res_status` `'PR'` / `'SEVA KUTIR'`) hide the temporary section and use the device-type bottom sheet.

---

## File Structure (Phase 2)

- Create `src/lib/wifiCache.ts` — moved from `src/utils/wifiCache.js`, typed. (Delete the old file in the final task.)
- Create `src/features/wifi/types.ts` — backend-accurate WiFi types.
- Create `src/features/wifi/api.ts` — query-key factory + React Query hooks (only WiFi backend access).
- Create `src/features/wifi/components/PermanentWifiSection.tsx` — moved from `src/components/`, props retyped.
- Create `src/features/wifi/components/TemporaryWifiSection.tsx` — moved from `src/components/`, props retyped.
- Create `src/features/wifi/screens/WifiScreen.tsx` — moved from `src/app/(home)/wifi.tsx`, rewired to hooks.
- Modify `src/app/(home)/wifi.tsx` — reduce to thin re-export.
- Modify `src/stores/useAuthStore.js` — import `wifiCache` from `@/lib/wifiCache`.
- Delete `src/utils/wifiCache.js`, `src/components/PermanentWifiSection.tsx`, `src/components/TemporaryWifiSection.tsx` (final task).

---

## Task 1: Backend-accurate types + move `wifiCache` to `lib/`

**Files:**
- Create: `src/features/wifi/types.ts`
- Create: `src/lib/wifiCache.ts`
- Delete: `src/utils/wifiCache.js`
- Modify: `src/stores/useAuthStore.js`
- Modify: `src/app/(home)/wifi.tsx` (only the `wifiCache` import path, temporarily — the file is replaced in Task 4)

**Interfaces:**
- Produces: `TempWifiCode`, `PermanentWifiCode`, `PermanentWifiStatus` (types); `wifiCache` with `.get(key)`, `.set(key, value)`, `.clear()` from `@/lib/wifiCache`.

- [ ] **Step 1: Create `src/features/wifi/types.ts`**

```ts
// src/features/wifi/types.ts
// Backend-accurate (verified against aashray-backend wifi controller/models).
export type PermanentWifiStatus = 'pending' | 'approved' | 'rejected' | 'reset';

export interface TempWifiCode {
  password: string;
  createdAt?: string;
}

export interface PermanentWifiCode {
  id: number;
  username?: string;
  code?: string | null;
  ssid?: string | null;
  status: PermanentWifiStatus;
  requested_at?: string;
  reviewed_at?: string | null;
  admin_comments?: string | null;
}
```

- [ ] **Step 2: Read the current `src/utils/wifiCache.js`, then create `src/lib/wifiCache.ts`** preserving its exact behavior (same MMKV instance `id: 'wifi-cache'`, same get/set/clear semantics), typed:

```ts
// src/lib/wifiCache.ts
import { MMKV } from 'react-native-mmkv';

// Long-term offline cache for WiFi data. Separate MMKV instance (id 'wifi-cache')
// so clearing it on logout does not touch auth/dev stores. Shared by the wifi
// feature and useAuthStore (logout), hence it lives in lib/, not the feature.
const cache = new MMKV({ id: 'wifi-cache' });

export const wifiCache = {
  get: <T = unknown>(key: string): T | null => {
    try {
      const value = cache.getString(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error) {
      console.error('Error reading wifiCache:', error);
      return null;
    }
  },
  set: (key: string, value: unknown): void => {
    try {
      cache.set(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing wifiCache:', error);
    }
  },
  clear: (): void => {
    try {
      cache.clearAll();
    } catch (error) {
      console.error('Error clearing wifiCache:', error);
    }
  },
};
```

IMPORTANT: match the EXACT semantics of the existing `src/utils/wifiCache.js` (read it first). If the existing `clear()` uses a different MMKV method name or the get/set do NOT JSON-(de)serialize, mirror whatever the existing file does so on-disk behavior is unchanged. Keep the same MMKV `id`.

- [ ] **Step 3: Update `src/stores/useAuthStore.js`** — change the `wifiCache` import from `'../utils/wifiCache'` to `'@/lib/wifiCache'`. Leave the `wifiCache.clear()` call in `logout` unchanged.

- [ ] **Step 4: Update the `wifiCache` import in `src/app/(home)/wifi.tsx`** to `'@/lib/wifiCache'` (this file is replaced in Task 4; this keeps it compiling meanwhile).

- [ ] **Step 5: Delete `src/utils/wifiCache.js`.**

- [ ] **Step 6: Verify** — `grep -rn "utils/wifiCache" src` returns 0. `npm run lint` → 0. Typecheck ≤ 84.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(wifi): backend-accurate types + move wifiCache to lib"
```

---

## Task 2: React Query hooks (`features/wifi/api.ts`)

**Files:**
- Create: `src/features/wifi/api.ts`

**Interfaces:**
- Consumes: `apiClient` (`@/lib/api/client`), `wifiCache` (`@/lib/wifiCache`), types (`./types`).
- Produces (exact signatures the screen in Task 4 relies on):
  - `wifiKeys.temp(cardno: string): string[]` and `wifiKeys.permanent(cardno: string): string[]`
  - `useTempWifiCodes(cardno: string)` → `UseQueryResult<TempWifiCode[]>`
  - `usePermanentWifiCode(cardno: string)` → `UseQueryResult<PermanentWifiCode[]>`
  - `useGenerateTempCode(cardno: string)` → `UseMutationResult<void, unknown, void>`
  - `useRequestPermanentCode(cardno: string)` → `UseMutationResult<void, unknown, { deviceType: string }>`
  - `useResetPermanentCode(cardno: string)` → `UseMutationResult<void, unknown, number>`

- [ ] **Step 1: Create `src/features/wifi/api.ts`**

```ts
// src/features/wifi/api.ts
import { useMutation, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { wifiCache } from '@/lib/wifiCache';

import type { TempWifiCode, PermanentWifiCode } from './types';

interface WifiEnvelope<T> {
  message?: string;
  data: T;
}

export const wifiKeys = {
  temp: (cardno: string) => ['wifi', cardno],
  permanent: (cardno: string) => ['wifi-permanent', cardno],
};

// GET /wifi — temporary passwords. Caches to wifiCache (offline seed) inside the
// queryFn (v5 has no onSuccess). allowToast:false mirrors the legacy call.
export function useTempWifiCodes(cardno: string) {
  return useQuery<TempWifiCode[]>({
    queryKey: wifiKeys.temp(cardno),
    queryFn: async () => {
      const res = await apiClient.get<WifiEnvelope<TempWifiCode[]>>('/wifi', {
        params: { cardno },
        allowToast: false,
      });
      const data = Array.isArray(res.data) ? res.data : [];
      wifiCache.set(`wifi:${cardno}`, data);
      return data;
    },
    enabled: !!cardno,
    staleTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
    initialData: () => wifiCache.get<TempWifiCode[]>(`wifi:${cardno}`) ?? undefined,
  });
}

// GET /wifi/permanent — permanent code status.
export function usePermanentWifiCode(cardno: string) {
  return useQuery<PermanentWifiCode[]>({
    queryKey: wifiKeys.permanent(cardno),
    queryFn: async () => {
      const res = await apiClient.get<WifiEnvelope<PermanentWifiCode[]>>('/wifi/permanent', {
        params: { cardno },
        allowToast: false,
      });
      const data = Array.isArray(res.data) ? res.data : [];
      wifiCache.set(`permanent:${cardno}`, data);
      return data;
    },
    enabled: !!cardno,
    staleTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
    initialData: () => wifiCache.get<PermanentWifiCode[]>(`permanent:${cardno}`) ?? undefined,
  });
}

// GET /wifi/generate — generate a temp code (server side-effect; response ignored).
export function useGenerateTempCode(cardno: string) {
  return useMutation<void, unknown, void>({
    mutationFn: async () => {
      await apiClient.get('/wifi/generate', { params: { cardno } });
    },
  });
}

// POST /wifi/permanent — request a permanent code.
export function useRequestPermanentCode(cardno: string) {
  return useMutation<void, unknown, { deviceType: string }>({
    mutationFn: async ({ deviceType }) => {
      await apiClient.post('/wifi/permanent', { cardno, deviceType });
    },
  });
}

// POST /wifi/permanent/reset — reset an approved permanent code.
export function useResetPermanentCode(cardno: string) {
  return useMutation<void, unknown, number>({
    mutationFn: async (id) => {
      await apiClient.post('/wifi/permanent/reset', { id, cardno });
    },
  });
}
```

- [ ] **Step 2: Verify** — `npm run lint` → 0; typecheck ≤ 84.

- [ ] **Step 3: Commit**

```bash
git add src/features/wifi/api.ts
git commit -m "feat(wifi): react-query hooks over apiClient (typed)"
```

---

## Task 3: Move the section components into the feature

**Files:**
- Create: `src/features/wifi/components/PermanentWifiSection.tsx` (from `src/components/PermanentWifiSection.tsx`)
- Create: `src/features/wifi/components/TemporaryWifiSection.tsx` (from `src/components/TemporaryWifiSection.tsx`)

**Interfaces:**
- Produces the two components with the SAME prop names as today, but their data-shape props typed from `@/features/wifi/types`:
  - `PermanentWifiSection` props: `data: PermanentWifiCode[] | null; isLoading; isError; isSubmitting; onRequestCode: (data: { deviceType: string }, onSuccess?: () => void) => void; onInfoPress: () => void; onResetCode?: (id: number) => void; isResettingCode?: boolean; isResidentOrSevakutir?: boolean`
  - `TemporaryWifiSection` props: `codes: TempWifiCode[] | null; isLoading; isError; isGenerating; maxCodes?: number; onGenerateCode: () => void`

- [ ] **Step 1:** Copy `src/components/PermanentWifiSection.tsx` to `src/features/wifi/components/PermanentWifiSection.tsx`. Replace its local `PermanentWifiData`/`PermanentWifiSectionProps` interfaces: import `PermanentWifiCode` from `@/features/wifi/types` and use `PermanentWifiCode[] | null` for `data`; change `onResetCode` to `(id: number) => void`. Remove the unused `res_status` field usage if present. Fix any now-relative imports to `@/...`. Do NOT change rendering/logic.

- [ ] **Step 2:** Copy `src/components/TemporaryWifiSection.tsx` to `src/features/wifi/components/TemporaryWifiSection.tsx`. Type `codes` as `TempWifiCode[] | null` (import from `@/features/wifi/types`). Do NOT change rendering/logic.

- [ ] **Step 3:** Leave the ORIGINAL `src/components/*WifiSection.tsx` files in place for now (deleted in Task 4 after the screen switches to the new paths) so nothing breaks mid-task.

- [ ] **Step 4: Verify** — `npm run lint` → 0; typecheck ≤ 84 (the two new files must compile; the old ones still exist).

- [ ] **Step 5: Commit**

```bash
git add src/features/wifi/components
git commit -m "refactor(wifi): move section components into feature, retype props"
```

---

## Task 4: Migrate the screen to hooks + thin the route + delete old files

**Files:**
- Create: `src/features/wifi/screens/WifiScreen.tsx` (migrated from `src/app/(home)/wifi.tsx`)
- Modify: `src/app/(home)/wifi.tsx` → thin re-export
- Delete: `src/components/PermanentWifiSection.tsx`, `src/components/TemporaryWifiSection.tsx`

**Interfaces:**
- Consumes: hooks from `./api`, components from `../components/*`, types from `../types`.
- Produces: `WifiScreen` as the DEFAULT export of `src/features/wifi/screens/WifiScreen.tsx`.

- [ ] **Step 1: Create `src/features/wifi/screens/WifiScreen.tsx`** by moving the entire current `src/app/(home)/wifi.tsx` body, then making EXACTLY these substitutions (keep everything else — the tutorials constant, the Modal, `renderTutorialItem`, `PageHeader`, error UI, JSX structure — byte-for-byte):

  1. Rename the component from `Wifi` to `WifiScreen`; keep `export default WifiScreen`.
  2. Update imports: `PermanentWifiSection`/`TemporaryWifiSection` from `../components/...`; remove the `handleAPICall`, `wifiCache`, and `useQuery` imports; add `import { useTempWifiCodes, usePermanentWifiCode, useGenerateTempCode, useRequestPermanentCode, useResetPermanentCode } from '../api';`. Keep `useAuthStore`, `status`, `Haptics`, `Linking`, RN imports, `CustomErrorMessage`, `ExpandableItem`, `PageHeader`.
  3. DELETE the five inline functions `fetchWifiPasswords`, `fetchPermanentWifiCode`, `generateNewWifiCode`, `requestPermanentWifiCode`, `resetPermanentWifiCode` and the two inline `useQuery(...)` blocks.
  4. Replace them with:
     ```tsx
     const tempQuery = useTempWifiCodes(user.cardno);
     const permanentQuery = usePermanentWifiCode(user.cardno);
     const generateMutation = useGenerateTempCode(user.cardno);
     const requestPermanentMutation = useRequestPermanentCode(user.cardno);
     const resetMutation = useResetPermanentCode(user.cardno);
     ```
     Map the names used later in JSX to the query fields:
     `wifiList = tempQuery.data`, `isLoading = tempQuery.isLoading`, `isError = tempQuery.isError`, `error = tempQuery.error`, `refetch = tempQuery.refetch`; `permanentWifiData = permanentQuery.data`, `isPermanentLoading = permanentQuery.isLoading`, `isPermanentError = permanentQuery.isError`, `refetchPermanent = permanentQuery.refetch`. (Either destructure with these names or update the JSX references — keep the JSX prop values equivalent.)
  5. Remove the local `isSubmitting`, `isPermanentSubmitting`, `isResettingCode` state; use the mutations' `isPending` instead. Rewrite the three handlers to preserve behavior EXACTLY (success haptic + refetch on success; console.error on failure):
     ```tsx
     const handleGenerateCode = async () => {
       try {
         await generateMutation.mutateAsync();
         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
         tempQuery.refetch();
       } catch (e) {
         console.error('Error generating code:', e);
       }
     };
     const handleRequestPermanentCode = async (
       data: { deviceType: string },
       onSuccess?: () => void
     ) => {
       try {
         await requestPermanentMutation.mutateAsync(data);
         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
         onSuccess?.();
         permanentQuery.refetch();
       } catch (e) {
         console.error('Error requesting permanent code:', e);
       }
     };
     const handleResetPermanentCode = async (id: number) => {
       try {
         await resetMutation.mutateAsync(id);
         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
         permanentQuery.refetch();
       } catch (e) {
         console.error('Error resetting permanent code:', e);
       }
     };
     ```
  6. In the JSX, pass `isSubmitting={requestPermanentMutation.isPending}`, `isResettingCode={resetMutation.isPending}`, `isGenerating={generateMutation.isPending}`. Keep `onRefresh` using `tempQuery.refetch()` + `permanentQuery.refetch()`. Everything else (Modal, tutorials, error block, `isResidentOrSevakutir`) stays identical.

  NOTE: the legacy code showed NO error toast on generate/request/reset (the `handleAPICall` calls used default `allowToast=true` for generate/request/reset, so a toast DID show on those). Preserve that: the mutation hooks call `apiClient` with default `allowToast` (true) for generate/request/reset, so the toast still fires. The two GET queries used `allowToast:false` (already set in `api.ts`). Confirm this matches.

- [ ] **Step 2: Reduce `src/app/(home)/wifi.tsx` to a thin route:**

```tsx
export { default } from '@/features/wifi/screens/WifiScreen';
```

- [ ] **Step 3: Delete** `src/components/PermanentWifiSection.tsx` and `src/components/TemporaryWifiSection.tsx`.

- [ ] **Step 4: Verify no dangling references** — `grep -rn "components/PermanentWifiSection\|components/TemporaryWifiSection" src` returns 0 (only the feature paths remain). `grep -rn "from '@/utils/HandleApiCall'" src/features/wifi` returns 0 (the feature uses hooks, not the shim).

- [ ] **Step 5: Gate checks** — `npm run lint` → 0; typecheck ≤ 84; then the bundle gate:
  `npx expo export --platform android --output-dir /tmp/p2-export` exits 0; then `rm -rf /tmp/p2-export`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(wifi): screen uses feature hooks; route is a thin re-export"
```

---

## Phase 2 Completion Gate

- [ ] `npm run lint` → 0 problems.
- [ ] Typecheck ≤ 84 (ideally lower — WiFi is now typed).
- [ ] `npx expo export --platform android` exits 0.
- [ ] `src/app/(home)/wifi.tsx` is a one-line re-export; all WiFi logic lives under `src/features/wifi/`.
- [ ] No file imports `@/utils/wifiCache` (moved to `@/lib/wifiCache`); `src/utils/wifiCache.js` deleted.
- [ ] WiFi screen calls no `handleAPICall`/`axios` directly — only `features/wifi/api.ts` hooks.
- [ ] Simulator smoke-test (controller/user): open WiFi, pull-to-refresh, generate a temp code, open the info modal — behavior unchanged.

---

## Self-Review (author checklist — completed)

- **Spec coverage:** feature-folder with screens/components/api/types ✓; thin route ✓; React Query hooks over apiClient ✓; backend-accurate types ✓; wifiCache boundary resolved by moving to lib ✓.
- **Placeholder scan:** api.ts and types.ts are complete code; wifiCache.ts complete; screen migration is a precise transform of a file whose full contents are known. No TBDs.
- **Type consistency:** hook names/signatures in Task 2 (`useTempWifiCodes`, `usePermanentWifiCode`, `useGenerateTempCode`, `useRequestPermanentCode`, `useResetPermanentCode`, `wifiKeys`) match their consumers in Task 4; `onResetCode`/reset mutation both use `id: number`; `TempWifiCode`/`PermanentWifiCode` used consistently across api.ts, components (Task 3), and screen.
- **Behavior parity risks:** temp/permanent GETs keep `allowToast:false`; generate/request/reset keep default toast; success haptics + refetch preserved; `initialData` offline-seed preserved; `refetchOnMount:'always'` + 30min staleTime preserved.
