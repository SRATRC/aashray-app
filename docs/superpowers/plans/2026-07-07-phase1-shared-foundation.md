# Phase 1 — Shared Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared foundation (tokens, UI-primitive base, typed `lib/` infra, guardrails) that every later domain migration reuses — with zero user-visible behavior change.

**Architecture:** Introduce three shared layers — `src/theme/` (one token source feeding both `tailwind.config` and JS consumers), `src/lib/` (MMKV storage, QueryClient, a promise-based typed axios client), and `src/components/ui/` (owned primitives on NativeWind) — then add guardrails (path alias, `allowJs`, ESLint import boundaries) so the structure can't rot. The legacy `handleAPICall` stays working as a thin shim over the new client so nothing breaks yet.

**Tech Stack:** React Native 0.79 / Expo SDK 54–56, Expo Router 6, TypeScript, NativeWind (Tailwind), Zustand + MMKV, TanStack React Query, axios, Sentry.

## Global Constraints

- No user-visible behavior change in Phase 1 — structural only.
- `npm run lint` (ESLint + Prettier) MUST pass clean at the end of every task.
- `npx tsc --noEmit` MUST pass clean at the end of every task.
- NativeWind only — no Tamagui/gluestack, no new heavyweight UI dependency.
- No `export *` barrels; feature/public re-exports must be explicit named exports only.
- Preserve MMKV on-disk persistence format exactly (store names `auth-store`, `dev-store`; same serialized bytes) — a format change would wipe users' persisted login.
- Do not downgrade any dependency below known floors: `react-native-razorpay >= 3.0.0`, `@gorhom/bottom-sheet >= 5.2.14` (SDK 55/56 / New Arch).
- Commit after every task with a conventional-commit message.

---

## File Structure (created/modified in Phase 1)

- Create `src/theme/palette.js` — raw color palette, CJS (require-able by `tailwind.config.js`).
- Create `src/theme/tokens.ts` — typed semantic tokens (wraps palette).
- Modify `tailwind.config.js` — consume `palette.js` instead of inline hex.
- Modify `src/constants/colors.js` — re-export from palette (kept for the 50 existing importers).
- Create `src/lib/storage.ts` — one MMKV instance + Zustand storage adapter.
- Create `src/lib/queryClient.ts` — the shared QueryClient (moved out of `_layout.tsx`).
- Create `src/lib/api/client.ts` — promise-based typed axios client.
- Create `src/lib/api/types.ts` — shared API envelope/error types.
- Modify `src/utils/HandleApiCall.js` — becomes a thin shim delegating to `client.ts`.
- Modify `src/stores/useAuthStore.js`, `src/stores/useDevStore.js` — use `lib/storage.ts`.
- Modify `src/app/_layout.tsx` — import QueryClient from `lib/`.
- Create `src/components/ui/` — `Text.tsx`, `Button.tsx` (exemplars), `index.ts` (explicit re-exports), `README.md` (recipe).
- Modify `tsconfig.json` — `allowJs`, alias `@/* → src/*`.
- Modify `package.json` — `typecheck` script; ESLint `eslintConfig` boundary rules.

---

## Task 1: Add typecheck script + `allowJs` (make TS/JS coexist)

**Files:**
- Modify: `tsconfig.json`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `npm run typecheck` → runs `tsc --noEmit`. Used as a verification gate in every later task.

- [ ] **Step 1: Add `allowJs` and broaden include in `tsconfig.json`**

Replace the `compilerOptions`/`include` so `.js` files are type-visited but not error-blocking yet:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "allowJs": true,
    "checkJs": false,
    "ignoreDeprecations": "6.0",
    "baseUrl": ".",
    "paths": {
      "@/*": ["*"]
    },
    "jsx": "react-jsx"
  },
  "include": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "nativewind-env.d.ts"]
}
```

(The alias stays `@/* → *` for now; Task 9 changes it. `checkJs:false` keeps existing JS from erroring.)

- [ ] **Step 2: Add a `typecheck` script to `package.json`**

In the `scripts` block add:

```json
"typecheck": "tsc --noEmit"
```

- [ ] **Step 3: Run typecheck to establish a clean baseline**

Run: `npm run typecheck`
Expected: exits 0 (no errors). If pre-existing errors appear, record them; they must not increase in later tasks.

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add tsconfig.json package.json
git commit -m "chore(config): allowJs + typecheck script for incremental TS"
```

---

## Task 2: Single color token source (`theme/palette.js` + `theme/tokens.ts`)

**Files:**
- Create: `src/theme/palette.js`
- Create: `src/theme/tokens.ts`

**Interfaces:**
- Produces: `palette` (CJS default export, plain hex map) consumed by `tailwind.config.js` (Task 3) and `constants/colors.js` (Task 4). `tokens` (TS) for typed consumers.

- [ ] **Step 1: Create `src/theme/palette.js`** (CJS so `tailwind.config.js` can `require` it)

Reconcile the two prior sources into one. Values are the union already used; where `constants/colors.js` and `tailwind.config.js` disagreed, tailwind's structured scale wins (it was the more complete/among-newer set):

```js
// src/theme/palette.js
// SINGLE SOURCE OF TRUTH for raw color values.
// Consumed by tailwind.config.js (NativeWind classNames) and
// src/constants/colors.js (JS consumers). Do not hard-code hex elsewhere.
const palette = {
  primary: '#161622',
  secondary: { DEFAULT: '#F1AC09', 50: '#FFEFDB', 100: '#FF9001', 200: '#FF8E01' },
  black: { DEFAULT: '#000000', 100: '#1E1E2D', 200: '#232533' },
  white: { DEFAULT: '#FFFFFF', 100: '#F5F5F5' },
  gray: {
    50: '#F9FAFB', 100: '#FAFAFC', 200: '#E5E7EB', 300: '#D1D5DB', 400: '#9CA3AF',
    500: '#6B7280', 600: '#4B5563', 700: '#374151', 800: '#1F2937', 900: '#111827',
  },
  green: { 100: '#E7FFEA', 200: '#05B617' },
  red: { 100: '#FFF1F1', 200: '#EB5757' },
  zinc: { 100: '#f4f4f5' },
  orange: '#F1AC09',
};

module.exports = palette;
```

- [ ] **Step 2: Create `src/theme/tokens.ts`** (typed wrapper + flat aliases matching the old `colors` default export keys)

```ts
// src/theme/tokens.ts
import palette from './palette';

export { palette };

// Flat aliases preserving the exact keys the legacy `colors` object exposed,
// so existing `colors.xxx` call sites keep working after Task 4.
export const colors = {
  orange: palette.orange,
  secondary_50: palette.secondary[50],
  secondary_100: palette.secondary[100],
  secondary_200: palette.secondary[200],
  gray_100: palette.gray[100],
  gray_200: palette.gray[200],
  gray_400: palette.gray[400],
  gray_500: palette.gray[500],
  gray_600: palette.gray[600],
  gray_700: palette.gray[700],
  gray_800: palette.gray[800],
  gray_900: palette.gray[900],
  black: palette.black.DEFAULT,
  black_100: palette.black[100],
  black_200: palette.black[200],
  white: palette.white.DEFAULT,
  white_100: palette.white[100],
  zinc_100: palette.zinc[100],
} as const;

export type Colors = typeof colors;
```

- [ ] **Step 3: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/theme/palette.js src/theme/tokens.ts
git commit -m "feat(theme): single color token source (palette + typed tokens)"
```

---

## Task 3: Point `tailwind.config.js` at the token source

**Files:**
- Modify: `tailwind.config.js`

**Interfaces:**
- Consumes: `src/theme/palette.js` from Task 2.
- Produces: identical NativeWind color classes as before (no visual change).

- [ ] **Step 1: Replace the inline `colors` block with the palette import**

Change the top of `tailwind.config.js` and the `theme.extend.colors` value:

```js
/** @type {import('tailwindcss').Config} */
const palette = require('./src/theme/palette');

module.exports = {
  content: ['./src/app/**/*.{js,jsx,ts,tsx}', './src/components/**/*.{js,jsx,ts,tsx}', './src/features/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: palette.primary,
        secondary: palette.secondary,
        black: palette.black,
        white: palette.white,
        gray: palette.gray,
        green: palette.green,
        red: palette.red,
      },
      fontFamily: {
        // unchanged — keep the existing fontFamily block exactly as-is
      },
    },
  },
  plugins: [],
};
```

Keep the existing `fontFamily` block byte-for-byte. Note the added `src/features/**` glob (forward-looking for Phase 3).

- [ ] **Step 2: Verify color classes resolve unchanged**

Run: `npx tailwindcss -i ./global.css -o /tmp/tw-check.css --content "./src/app/**/*.tsx" 2>/dev/null; echo done`
Then confirm the app still starts: `npm run start` (start Metro; no red screen). Stop after confirming bundle builds.

- [ ] **Step 3: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.js
git commit -m "refactor(theme): tailwind colors derive from palette token source"
```

---

## Task 4: Make `constants/colors.js` re-export from tokens (dedupe)

**Files:**
- Modify: `src/constants/colors.js`

**Interfaces:**
- Consumes: `src/theme/tokens.ts` `colors`.
- Produces: the `constants` barrel's `colors` export is now identical values but single-sourced. The 50 existing importers are unaffected.

- [ ] **Step 1: Replace the body of `src/constants/colors.js` with a re-export**

```js
// Kept as the legacy import path for the 50 existing `colors` consumers.
// Values now come from the single token source in src/theme.
import { colors } from '../theme/tokens';

export default colors;
```

- [ ] **Step 2: Confirm shape parity**

Run:
```bash
node -e "const a=require('./src/constants/colors.js'); console.log(Object.keys(a.default||a).sort().join(','))"
```
Expected key set (order-insensitive): `black,black_100,black_200,gray_100,gray_200,gray_400,gray_500,gray_600,gray_700,gray_800,gray_900,orange,secondary_100,secondary_200,secondary_50,white,white_100,zinc_100`.
(If Node can't resolve the TS import directly, instead verify by reading `src/theme/tokens.ts` `colors` keys match the list above.)

- [ ] **Step 3: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/constants/colors.js
git commit -m "refactor(theme): constants/colors re-exports single token source"
```

---

## Task 5: Shared MMKV storage (`lib/storage.ts`)

**Files:**
- Create: `src/lib/storage.ts`
- Modify: `src/stores/useDevStore.js`
- Modify: `src/stores/useAuthStore.js`

**Interfaces:**
- Produces:
  - `storage: MMKV` — the one shared MMKV instance.
  - `zustandMmkvStorage` — a `createJSONStorage`-compatible storage passed to `persist({ storage })`.
- Consumes: nothing.

**Preservation note:** both stores currently use a default `new MMKV()` (same underlying file) and persist JSON strings under keys `auth-store` / `dev-store`. The shared adapter below produces byte-identical serialized values, so existing persisted state loads unchanged.

- [ ] **Step 1: Create `src/lib/storage.ts`**

```ts
// src/lib/storage.ts
import { MMKV } from 'react-native-mmkv';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

// The single shared MMKV instance for the app.
export const storage = new MMKV();

// Raw string <-> MMKV adapter. createJSONStorage handles JSON (de)serialization,
// matching the previous behavior of both stores.
const stateStorage: StateStorage = {
  setItem: (key, value) => {
    try {
      storage.set(key, value);
    } catch (error) {
      console.error('Error storing to MMKV:', error);
    }
  },
  getItem: (key) => {
    try {
      return storage.getString(key) ?? null;
    } catch (error) {
      console.error('Error reading from MMKV:', error);
      return null;
    }
  },
  removeItem: (key) => {
    try {
      storage.delete(key);
    } catch (error) {
      console.error('Error removing from MMKV:', error);
    }
  },
};

// Pass this to zustand persist: persist(config, { name, storage: zustandMmkvStorage })
export const zustandMmkvStorage = createJSONStorage(() => stateStorage);
```

- [ ] **Step 2: Update `src/stores/useDevStore.js`** to use the shared storage

Remove the local `MMKV`/`mmkvStorage`/`createJSONStorage` code; keep the store definition:

```js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandMmkvStorage } from '../lib/storage';

export const useDevStore = create(
  persist(
    (set) => ({
      useDevBackend: false,
      devPrNumber: '',
      setUseDevBackend: (value) => set({ useDevBackend: value }),
      setDevPrNumber: (value) => set({ devPrNumber: value }),
    }),
    {
      name: 'dev-store',
      storage: zustandMmkvStorage,
    }
  )
);
```

- [ ] **Step 3: Update `src/stores/useAuthStore.js`** to use the shared storage

Remove the local `MMKV`/`mmkvStorage`; keep `wifiCache` and `partialize`:

```js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { wifiCache } from '../utils/wifiCache';
import { zustandMmkvStorage } from '../lib/storage';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null });
        wifiCache.clear();
      },
    }),
    {
      name: 'auth-store',
      storage: zustandMmkvStorage,
      partialize: (state) => ({ user: state.user }),
    }
  )
);
```

- [ ] **Step 4: Manually verify persistence survives**

Run: `npm run start`, log in (or confirm an already-logged-in session persists across a Metro reload), toggle dev-backend in the dev screen, reload — state must persist. Confirm no logout on reload.

- [ ] **Step 5: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/lib/storage.ts src/stores/useDevStore.js src/stores/useAuthStore.js
git commit -m "refactor(lib): single shared MMKV storage for zustand stores"
```

---

## Task 6: Extract QueryClient into `lib/queryClient.ts`

**Files:**
- Create: `src/lib/queryClient.ts`
- Modify: `src/app/_layout.tsx`

**Interfaces:**
- Produces: `queryClient` (configured `QueryClient`) importable app-wide (needed later for imperative `invalidateQueries` / prefetch in feature `api.ts` files).

- [ ] **Step 1: Create `src/lib/queryClient.ts`** with the exact config currently inline in `_layout.tsx`

```ts
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});
```

- [ ] **Step 2: Update `src/app/_layout.tsx`** to import it and delete the inline definition

- Remove the inline `const queryClient = new QueryClient({...})` block.
- Change the import line `import { QueryClient, QueryClientProvider } from '@tanstack/react-query';` to `import { QueryClientProvider } from '@tanstack/react-query';`
- Add `import { queryClient } from '@/src/lib/queryClient';`

(The `<QueryClientProvider client={queryClient}>` usage stays unchanged.)

- [ ] **Step 3: Typecheck + lint + boot**

Run: `npm run typecheck && npm run lint`, then `npm run start` and confirm the app boots and a data screen (e.g. home) still loads.
Expected: clean; app behaves identically.

- [ ] **Step 4: Commit**

```bash
git add src/lib/queryClient.ts src/app/_layout.tsx
git commit -m "refactor(lib): extract shared QueryClient out of root layout"
```

---

## Task 7: Promise-based typed axios client (`lib/api/client.ts`) + shared types

**Files:**
- Create: `src/lib/api/types.ts`
- Create: `src/lib/api/client.ts`

**Interfaces:**
- Consumes: `resolveApiBaseUrl` from `src/utils/resolveBaseUrl.ts` (already exists).
- Produces:
  - `ApiError` class with `{ message, status?, data?, correlationId }`.
  - `apiClient` with methods `get<T>(endpoint, config?)`, `post<T>(endpoint, body?, config?)`, `put<T>(...)`, `patch<T>(...)`, `del<T>(...)` — each returns `Promise<T>` (resolves the response body, throws `ApiError` on non-2xx). Config supports `{ params, headers, allowToast }`.
  - These are what feature `api.ts` files (Phase 3) build React Query hooks on.

**Behavior parity:** the client must reproduce `handleAPICall`'s current behavior — `x-request-id` generation, dev-backend base URL (via `resolveApiBaseUrl`), Sentry breadcrumbs on request/error, `validateStatus: () => true` with 200/201 = success, error toast + error haptic when `allowToast`. Difference: it returns a promise instead of taking callbacks.

- [ ] **Step 1: Create `src/lib/api/types.ts`**

```ts
// src/lib/api/types.ts
// Standard backend envelope. Confirm/extend against aashray-backend responses
// as feature types are added in Phase 3.
export interface ApiEnvelope<T> {
  message?: string;
  data: T;
}

export interface ApiErrorDetails {
  message: string;
  status?: number;
  data?: unknown;
  correlationId: string;
}

export class ApiError extends Error {
  status?: number;
  data?: unknown;
  correlationId: string;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = 'ApiError';
    this.status = details.status;
    this.data = details.data;
    this.correlationId = details.correlationId;
  }
}
```

- [ ] **Step 2: Create `src/lib/api/client.ts`**

```ts
// src/lib/api/client.ts
import axios, { type AxiosRequestConfig } from 'axios';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import * as Sentry from '@sentry/react-native';
import { resolveApiBaseUrl } from '@/src/utils/resolveBaseUrl';
import { ApiError } from './types';

const generateRequestId = () =>
  Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface RequestConfig {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  allowToast?: boolean;
}

async function request<T>(
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  config: RequestConfig = {}
): Promise<T> {
  const { params, headers = {}, allowToast = true } = config;
  const requestId = generateRequestId();
  const baseUrl = resolveApiBaseUrl();

  if (!baseUrl) {
    throw new ApiError({
      message: 'Network configuration error: Base URL is missing.',
      correlationId: requestId,
    });
  }

  let data: unknown = body;
  const finalHeaders: Record<string, string> = { 'x-request-id': requestId, ...headers };

  // Preserve the legacy pfp multipart special-case.
  if (body && typeof body === 'object' && 'image' in (body as Record<string, unknown>)) {
    const form = new FormData();
    form.append('image', {
      // @ts-expect-error RN FormData file shape
      uri: (body as { image: string }).image,
      name: 'pfp.jpg',
      type: 'image/jpeg',
    });
    data = form;
    finalHeaders['Content-Type'] = 'multipart/form-data';
  }

  if (__DEV__) {
    console.log('------------');
    console.log('URL: ', `${baseUrl}${endpoint}`);
    console.log('PARAMS: ', JSON.stringify(params));
    console.log('BODY: ', JSON.stringify(body));
    console.log('------------');
  }

  Sentry.addBreadcrumb({
    category: 'api.request',
    message: `${method.toUpperCase()} ${endpoint}`,
    data: { params, body, requestId },
    level: 'info',
  });

  try {
    const res = await axios({
      method,
      url: `${baseUrl}${endpoint}`,
      params,
      data,
      headers: finalHeaders,
      validateStatus: () => true,
    });

    if (res.status === 200 || res.status === 201) {
      return res.data as T;
    }

    throw new ApiError({
      message: res.data?.message || 'An error occurred',
      status: res.status,
      data: res.data,
      correlationId: (res.headers['x-request-id'] as string) || requestId,
    });
  } catch (error: any) {
    const apiError =
      error instanceof ApiError
        ? error
        : new ApiError({
            message: error?.response?.data?.message || error?.message || 'An error occurred',
            status: error?.response?.status,
            data: error?.response?.data,
            correlationId:
              error?.response?.headers?.['x-request-id'] || requestId,
          });

    if (__DEV__) console.log('ERROR: ', apiError.message);

    Sentry.addBreadcrumb({
      category: 'api.error',
      message: `${endpoint} failed: ${apiError.message}`,
      data: { status: apiError.status, correlationId: apiError.correlationId },
      level: 'error',
    });
    Sentry.setTag('correlation_id', apiError.correlationId);

    if (allowToast) {
      Toast.show({
        type: 'error',
        text1: 'An error occurred!',
        text2: apiError.message,
        swipeable: false,
        text1Style: { color: 'red' },
        text2Style: { color: 'black', fontWeight: 'bold', fontSize: 14 },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    throw apiError;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, config?: RequestConfig) => request<T>('get', endpoint, undefined, config),
  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) => request<T>('post', endpoint, body, config),
  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) => request<T>('put', endpoint, body, config),
  patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig) => request<T>('patch', endpoint, body, config),
  del: <T>(endpoint: string, config?: RequestConfig) => request<T>('delete', endpoint, undefined, config),
};
```

- [ ] **Step 2b: Verify `axios` and `expo-haptics` are already dependencies**

Run: `node -e "const p=require('./package.json'); console.log('axios',p.dependencies.axios,'| haptics',p.dependencies['expo-haptics'])"`
Expected: both print versions (they are already used by `HandleApiCall.js`). If missing, stop and report.

- [ ] **Step 3: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/types.ts src/lib/api/client.ts
git commit -m "feat(lib): promise-based typed axios client"
```

---

## Task 8: Make legacy `handleAPICall` a thin shim over the new client

**Files:**
- Modify: `src/utils/HandleApiCall.js`

**Interfaces:**
- Consumes: `apiClient` from `src/lib/api/client.ts`.
- Produces: same default-exported `handleAPICall(method, endpoint, params, body, successCallback, finallyCallback, errorCallback, allowToast)` signature so all 45 existing call sites keep working unchanged. Removal happens in Phase 4.

**Why:** lets both paths coexist during migration; new feature code uses `apiClient` directly, old code keeps calling `handleAPICall`, and there is now exactly one place (the client) that talks to axios.

- [ ] **Step 1: Replace the body of `src/utils/HandleApiCall.js`**

```js
import { apiClient } from '../lib/api/client';

// Legacy callback-style wrapper — now delegates to the promise-based apiClient.
// New code should import apiClient directly; this shim exists so the ~45
// existing call sites keep working until they are migrated (Phase 3) and it
// is removed (Phase 4).
const handleAPICall = async (
  method,
  endpoint,
  params,
  body,
  successCallback,
  finallyCallback = () => {},
  errorCallback = () => {},
  allowToast = true
) => {
  const m = String(method).toLowerCase();
  try {
    let data;
    if (m === 'get') {
      data = await apiClient.get(endpoint, { params, allowToast });
    } else if (m === 'delete') {
      data = await apiClient.del(endpoint, { params, allowToast });
    } else {
      data = await apiClient[m](endpoint, body, { params, allowToast });
    }
    successCallback?.(data);
  } catch (error) {
    // apiClient already showed the toast/haptic when allowToast is true.
    errorCallback?.({
      message: error.message,
      status: error.status,
      data: error.data,
      correlationId: error.correlationId,
      originalError: error,
    });
  } finally {
    finallyCallback?.();
  }
};

export default handleAPICall;
```

- [ ] **Step 2: Smoke-test two real flows that use `handleAPICall`**

Run: `npm run start`. Exercise one GET flow (e.g. home/menu loads) and one POST flow (e.g. submit something small). Confirm success path works and an intentional error still shows the toast + haptic.

- [ ] **Step 3: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add src/utils/HandleApiCall.js
git commit -m "refactor(api): handleAPICall delegates to shared apiClient"
```

---

## Task 9: Standardize path alias `@/* → src/*` (codemod)

**Files:**
- Modify: `tsconfig.json`
- Modify: all files importing `@/src/...` (mechanical rewrite to `@/...`)

**Interfaces:**
- Produces: shorter, conventional imports (`@/lib/...`, `@/components/ui/...`). No runtime change (Metro resolves tsconfig `paths`).

**Note:** This is a pure mechanical rename. Do it as one atomic commit. If it causes any resolution issue with Metro, it can be reverted in isolation.

- [ ] **Step 1: Change the alias in `tsconfig.json`**

```json
"paths": {
  "@/*": ["src/*"]
}
```

- [ ] **Step 2: Rewrite all `@/src/` imports to `@/`**

Run (BSD sed on macOS):
```bash
grep -rl "@/src/" src | xargs sed -i '' 's#@/src/#@/#g'
```

- [ ] **Step 3: Confirm no stragglers remain**

Run: `grep -rn "@/src/" src | wc -l`
Expected: `0`.

- [ ] **Step 4: Typecheck + lint + boot**

Run: `npm run typecheck && npm run lint`, then `npm run start` and confirm the bundle builds with no "unable to resolve module" errors, and navigate a couple screens.
Expected: clean; app boots.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(config): standardize @/* path alias to src/*"
```

---

## Task 10: UI primitive foundation — `components/ui/` with `Text` + `Button` exemplars

**Files:**
- Create: `src/components/ui/Text.tsx`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/index.ts`
- Create: `src/components/ui/README.md`

**Interfaces:**
- Produces:
  - `Text` — typography primitive with a `variant` prop mapping to the font tokens (`pregular`/`psemibold`/etc.), so screens stop hard-coding `font-*` + `text-*` combos ad hoc.
  - `Button` — supersedes `CustomButton`, same variants (`solid` | `outline` | `pill`) and props, but token-correct (fixes the hard-coded `#F97316` that didn't match `secondary`).
  - `src/components/ui/index.ts` — explicit named re-exports (NO `export *`).
- Scope: this task establishes the pattern + two reference primitives. The remaining `Custom*` components are migrated incrementally during their domain's Phase 3 pass (per spec: opportunistic + Phase 4 sweep) — NOT all in Phase 1.

- [ ] **Step 1: Create `src/components/ui/Text.tsx`**

```tsx
import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

type Variant =
  | 'regular' | 'medium' | 'semibold' | 'bold'
  | 'light' | 'dmregular' | 'dmmedium';

const VARIANT_FONT: Record<Variant, string> = {
  regular: 'font-pregular',
  medium: 'font-pmedium',
  semibold: 'font-psemibold',
  bold: 'font-pbold',
  light: 'font-plight',
  dmregular: 'font-dmregular',
  dmmedium: 'font-dmmedium',
};

export interface TextProps extends RNTextProps {
  variant?: Variant;
  className?: string;
}

export function Text({ variant = 'regular', className = '', ...rest }: TextProps) {
  return <RNText className={`${VARIANT_FONT[variant]} ${className}`} {...rest} />;
}
```

- [ ] **Step 2: Create `src/components/ui/Button.tsx`** (token-correct successor to `CustomButton`)

```tsx
import React, { type FC } from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import { Text } from './Text';
import { palette } from '@/theme/tokens';

interface ButtonProps {
  text: string;
  handlePress: () => void;
  containerStyles?: string;
  textStyles?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  bgcolor?: string;
  variant?: 'solid' | 'outline' | 'pill';
}

export const Button: FC<ButtonProps> = ({
  text,
  handlePress,
  containerStyles = '',
  textStyles = '',
  isLoading = false,
  isDisabled = false,
  bgcolor = 'bg-secondary',
  variant = 'solid',
}) => {
  const disabled = isLoading || isDisabled;

  if (variant === 'pill') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={disabled}
        className={`h-14 flex-row items-center justify-center rounded-full ${bgcolor} ${containerStyles} ${disabled ? 'opacity-45' : ''}`}>
        <Text variant="dmmedium" className={`text-base text-white ${textStyles}`}>{text}</Text>
        {isLoading && <ActivityIndicator size="small" color={palette.white.DEFAULT} style={{ marginLeft: 10 }} />}
      </TouchableOpacity>
    );
  }

  const container =
    variant === 'outline'
      ? `border-2 border-secondary bg-white ${containerStyles}`
      : `${bgcolor} ${containerStyles}`;
  const textColor = variant === 'outline' ? 'text-secondary' : 'text-white';

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
      className={`flex-row items-center justify-center rounded-xl ${container} ${disabled ? 'opacity-50' : ''}`}>
      <Text variant="semibold" className={`text-lg ${textColor} ${textStyles}`}>{text}</Text>
      {isLoading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? palette.secondary.DEFAULT : palette.white.DEFAULT}
          style={{ marginLeft: 10 }}
        />
      )}
    </TouchableOpacity>
  );
};
```

- [ ] **Step 3: Create `src/components/ui/index.ts`** (explicit re-exports only)

```ts
export { Text } from './Text';
export type { TextProps } from './Text';
export { Button } from './Button';
```

- [ ] **Step 4: Create `src/components/ui/README.md`** (the recipe for migrating remaining primitives)

```md
# UI primitives

Owned primitives built on NativeWind. Screens compose these instead of
re-styling from scratch, so UI stays consistent.

## Rules
- Never hard-code a hex color or raw spacing in a component. Use NativeWind
  token classes (`bg-secondary`, `text-gray-500`) or `palette` from `@/theme/tokens`.
- Export every primitive from `index.ts` with an explicit named export (no `export *`).
- One primitive = one file, one responsibility, typed props (no `any`).

## Migrating a `Custom*` component into a primitive
1. Copy it into `src/components/ui/<Name>.tsx`, rename the export.
2. Replace inline hex / `StyleSheet` with token classes or `palette`.
3. Type the props (remove `any`).
4. Add it to `index.ts`.
5. Update call sites during that component's domain Phase 3 pass.

Reference implementations: `Text.tsx`, `Button.tsx`.
```

- [ ] **Step 5: Typecheck + lint**

Run: `npm run typecheck && npm run lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui
git commit -m "feat(ui): primitive foundation (Text, Button) + migration recipe"
```

---

## Task 11: ESLint import-boundary guardrails

**Files:**
- Modify: `package.json` (`eslintConfig`)

**Interfaces:**
- Produces: lint errors when new code violates the structure — a feature deep-importing another feature's internals, or non-`lib` code importing `axios` directly.

**Note:** `universe/native` already bundles `eslint-plugin-import`. These are `no-restricted-imports` rules (zero new deps) that apply as `features/` fills in during Phase 3.

- [ ] **Step 1: Replace the `eslintConfig` block in `package.json`**

```json
"eslintConfig": {
  "extends": "universe/native",
  "root": true,
  "rules": {
    "no-restricted-imports": [
      "error",
      {
        "patterns": [
          {
            "group": ["axios"],
            "message": "Import the shared apiClient from @/lib/api/client instead of axios directly."
          },
          {
            "group": ["@/features/*/*"],
            "message": "Import a feature only through its public entry (@/features/<name>), not its internals."
          }
        ]
      }
    ]
  },
  "overrides": [
    {
      "files": ["src/lib/api/client.ts"],
      "rules": { "no-restricted-imports": "off" }
    }
  ]
}
```

- [ ] **Step 2: Run lint to confirm the rules load and the codebase still passes**

Run: `npm run lint`
Expected: clean. (The only direct `axios` import is now `src/lib/api/client.ts`, which is exempted; `handleAPICall` no longer imports axios after Task 8. If any other direct `axios` import surfaces, migrate it to `apiClient` or add a scoped override and note it.)

- [ ] **Step 3: Verify a violation is actually caught (sanity check, then revert)**

Temporarily add `import axios from 'axios';` to any screen file, run `npm run lint`, confirm it errors with the custom message, then remove the line.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore(lint): import-boundary rules (no direct axios, no feature internals)"
```

---

## Phase 1 Completion Gate

Before declaring Phase 1 done:

- [ ] `npm run lint` clean.
- [ ] `npm run typecheck` clean.
- [ ] `npm run start` boots; spot-check home, a data-fetch screen, login persistence across reload, and one error toast.
- [ ] `grep -rn "@/src/" src | wc -l` → 0.
- [ ] Only `src/lib/api/client.ts` imports `axios` directly (`grep -rln "from 'axios'" src`).
- [ ] Colors defined once (`src/theme/palette.js`); `constants/colors.js` and `tailwind.config.js` both derive from it.

---

## Self-Review (author checklist — completed)

- **Spec coverage (Phase 1 items):** tokens single-sourced (Tasks 2–4 ✓); UI primitive foundation (Task 10 ✓, full consolidation deferred to domain passes per spec ✓); `lib/` infra — storage (5), QueryClient (6), axios client (7) ✓; guardrails — alias (9), allowJs (1), ESLint boundaries (11) ✓. **Gap:** spec mentioned relocating notifications + deeplinks into `lib/` in Phase 1 — deliberately deferred (pure move with wide import churn, no behavior/consistency value now; will ride along with Phase 3 or a later cleanup). Flag for user.
- **Placeholder scan:** no TBD/TODO; all code steps contain complete code.
- **Type consistency:** `apiClient` method names (`get/post/put/patch/del`) consistent between Task 7 (definition) and Task 8 (consumer); `zustandMmkvStorage` name consistent Tasks 5→(stores); `palette`/`colors` names consistent Tasks 2→3→4→10.
