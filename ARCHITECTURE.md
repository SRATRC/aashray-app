# Aashray App — Architecture & Conventions

Factual reference for anyone (human or agent) working in this repo. Describes the **current** structure and the rules to follow. If code and this doc disagree, the code wins — fix the doc.

## What this is

`aashray-app` is the **member-facing** React Native / Expo client for SRATRC (Shrimad Rajchandra Aatma Tatva Research Centre). Members use it to book stays (rooms/flats), food, travel, spiritual events (adhyayan, utsav), get WiFi codes, raise support tickets, and pay (Razorpay).

It is one of three repos. **The backend (`aashray-backend`) is the source of truth for all business logic** — pricing, availability, status transitions, credits/refunds. This app surfaces those rules; when behavior is unclear, verify against the backend, not this client. Auth is **cardno-based** (no JWT/session token): the login response is the user record, and every request carries `cardno`.

## Stack

- React Native **0.85.3**, Expo SDK **56**, Expo Router **6** (file-based routing), React 19 (React Compiler on).
- TypeScript (strict; `tsc --noEmit` is clean). A few legacy `.js` files remain (see "Known gaps").
- **NativeWind** (Tailwind for RN) for styling.
- **TanStack React Query 5** for server state; **Zustand** (+ **react-native-mmkv**) for client state.
- **axios** (only via the shared `apiClient`), **Sentry** (errors), **react-native-razorpay** (payments), **react-native-sse** (support live chat), Firebase/FCM (push), `@gorhom/bottom-sheet`, `@shopify/flash-list`.

## Directory map — where things go

```
src/
  app/            Expo Router routes ONLY. Route files are THIN — they re-export a feature screen.
                  Groups: (auth) (onboarding) (tabs) (home) (payment); plus adhyayan/ utsav/
                  booking/ guestBooking/ mumukshuBooking/ profile/ support/. _layout.tsx files
                  stay here (routing config).
  features/       The app, sliced by domain (see list below). Almost all real code lives here.
  components/     Shared, cross-feature UI (CustomButton, FormField, GuestForm, PageHeader, …).
    ui/           Owned design-system primitives (Text, Button) + README. Prefer these.
  lib/            App infrastructure:
    api/client.ts     the ONE HTTP client (apiClient) — every network call goes through it.
    api/types.ts      ApiEnvelope<T>, ApiError.
    api/resolveBaseUrl.ts  base-URL resolution (prod / dev / PR-specific backend).
    queryClient.ts    the shared React Query client.
    storage.ts        shared MMKV instance + zustand persistence adapter.
    wifiCache.ts      wifi offline cache (shared: wifi feature + auth logout).
  theme/          palette.js (SINGLE source of color values) + tokens.ts (typed tokens).
  stores/         Zustand: useAuthStore (user, MMKV-persisted), useBookingStore (+ bookingTypes.ts),
                  useDevStore (dev-backend toggle).
  hooks/          Genuinely shared hooks (useDeepLinkHandler, useQuickImagePicker, useRefetchOnFocus,
                  useTabBarPadding, useUtsavDate).
  constants/      colors, dropdowns, icons, images, prices, status, types (shared, some legacy .js).
  config/         deeplinks.ts (deep-link route registry).
  utils/          cross-cutting utils incl. preparingRequestBody.ts (booking payload builder).
```

**Features** (`src/features/*`): `auth`, `onboarding`, `wifi`, `support`, `contact`, `menu`, `maintenance`, `profile`, `events` (adhyayan + utsav), `payments`, `booking`.

## Feature anatomy (the pattern to copy)

Every feature follows the same shape:

```
src/features/<domain>/
  screens/       the real screen components (moved out of app/)
  components/    domain-only components + extracted presentational sections
  hooks/         domain hooks (optional)
  api.ts         React Query hooks + query-key factory over apiClient — the ONLY backend access
  types.ts       backend-accurate request/response types (no `any` on API boundaries)
  index.ts       barrel: explicit named re-exports of the feature's screens (NO `export *`)
```

**Routing rule:** an Expo Router file in `src/app/…` is a one-line re-export through the feature barrel:
```ts
import { WifiScreen } from '@/features/wifi';
export default WifiScreen;
```
Never point a route (or any external file) at a deep `@/features/<x>/screens/…` path — import the feature's public entry `@/features/<x>` (enforced by ESLint).

## Data layer

- **`apiClient`** (`@/lib/api/client`) is the single HTTP layer: `get/post/put/patch/del`, promise-based, typed (`apiClient.get<T>(...)` resolves the response body, throws `ApiError` on non-2xx). It handles base-URL resolution, `x-request-id`, an error toast + haptic (unless `{ allowToast: false }`), Sentry breadcrumbs, and a `body.image` → multipart upload case.
- **Per feature, `api.ts`** wraps endpoints as React Query hooks (`useX`) with a `xKeys` query-key factory, plus plain `apiClient` functions where the flow is imperative (e.g. store-then-navigate, or logic coupled to something else). Screens call these — they never touch axios or build URLs.
- **To add an endpoint:** add a function/hook to the relevant feature's `api.ts`, type its request/response in `types.ts` against the backend model/controller, and call it from the screen.
- **Two intentional non-`apiClient` network paths** (do not "fix"): `RazorpayCheckout.open()` (payments/booking) and `react-native-sse` `EventSource` (support live chat).
- `EXPO_PUBLIC_BASE_URL` / `EXPO_PUBLIC_DEV_BASE_URL` drive the base URL; the dev-backend toggle + `devPrNumber` (in `useDevStore`) can point at a PR preview backend.

## State

- **Server state → React Query.** Global defaults: `staleTime` 5m, `gcTime` 30m, no refetch on focus/mount/reconnect (`src/lib/queryClient.ts`). Individual hooks override as needed (e.g. lists use `refetchOnMount: 'always'`).
- **Client state → Zustand** (`src/stores/`):
  - `useAuthStore` — the logged-in `user`; persisted to MMKV. `setUser`, `logout`.
  - `useBookingStore` — in-progress booking selections: `guestData` / `mumukshuData` slices (keyed by booking type + `primary`), `guestInfo` / `mumukshuInfo`. Types in `bookingTypes.ts`. (Note: "self" booking is modeled as a single-member mumukshu.)
  - `useDevStore` — dev-backend toggle + PR number.
- **MMKV** (`src/lib/storage.ts`) backs all persisted stores through one shared instance.

## Design system

- **Colors: one source — `src/theme/palette.js`** (plain CJS so `tailwind.config.js` can `require` it). It feeds both NativeWind classes (via `tailwind.config`) and typed JS consumers (`src/theme/tokens.ts`, re-exported by `constants/colors`). **Never hard-code a hex value** in a component — use a NativeWind token class (`bg-secondary`, `text-gray-500`) or `palette` from `@/theme/tokens`.
- **Primitives: `src/components/ui/`** (`Text` with font `variant`s, `Button`). Compose these; see `src/components/ui/README.md` for the recipe when adding one. Screens compose primitives + shared `@/components/*` + feature components.
- Fonts: Poppins (`font-p*`) and DM Sans (`font-dm*`) families, declared in `tailwind.config.js`.
- UI patterns already in use: `@gorhom/bottom-sheet` (prefer over full modals), `FlashList` for lists, Shimmer skeletons.

## Conventions — rules to follow

**Enforced by tooling (CI/ESLint/TS):**
- `npm run lint` must be **0 problems** (ESLint + Prettier). The repo is fully lint-clean; keep it that way.
- `tsc --noEmit` must stay clean. No `any` on API boundaries — type against the backend.
- **No direct `axios`** anywhere except `lib/api/client.ts` — use `apiClient` / feature hooks.
- **No deep feature imports** (`@/features/<x>/<internals>`) — import a feature via its barrel `@/features/<x>`.
- **No `export *`** — barrels use explicit named exports.
- Path alias: **`@/*` → `src/*`**.
- Native/generated dirs are lint-ignored via `.eslintignore` / `.prettierignore` (`ios/`, `android/`, `dist/`, `assets/`, generated `*-env.d.ts`).

**Expected (not machine-enforced):**
- New screens go in a feature (`src/features/<domain>/screens/`), with the route file as a thin re-export.
- Backend is authoritative — derive types and behavior from `aashray-backend`.
- Preserve exact request/response shapes and store-push shapes when refactoring (the untyped `useBookingStore` + `preparingRequestBody` couple by shape, not import).
- Tests: none yet. Structure is built to be testable (pure logic in hooks/utils, presentational components) — jest-expo + RNTL is the intended stack.

## Key flows

- **Booking:** a picker (`features/booking` book-now hub, or an event detail screen) writes the selection into `useBookingStore` and routes to `booking|guestBooking|mumukshuBooking/[booking]` (addon selection) → `bookingReview` → submit. `preparingRequestBody.ts` turns the store slice into the API payload; submit hits `/mumukshu/booking` or `/guest/booking` and, if payable, opens Razorpay. There is no client-side availability endpoint — the `/validate` call does availability + pricing.
- **Payments:** `payments/PendingPaymentsScreen` lists pending transactions → `/razorpay/payv2` creates an order → `RazorpayCheckout.open()` → routes to `/paymentConfirmation` or `/paymentFailed`. **No client-side payment verification** — the backend `/razorpay/verifyPayment` webhook settles asynchronously; a resolved checkout does not mean the transaction is `completed` yet.
- **Support:** ticket list + create + a live chat screen. Chat updates arrive over **SSE** (`useTicketStream`); message send is optimistic and reconciled against the SSE stream (the temp-message shape is a load-bearing contract). Media upload = presign → direct S3 PUT.
- **Auth/onboarding:** `features/auth` sign-in (`/client/verifyAndLogin`, forgot-password) sets `user`; `features/onboarding` (image capture → complete profile) uses the shared `ProfileForm`. Root `_layout.tsx` guards navigation via `Stack.Protected` on user state: no user → needs PFP → needs profile → fully onboarded.

## Commands

```bash
npm run start       # Expo dev server
npm run ios         # iOS simulator
npm run android     # Android emulator
npm run lint        # ESLint + Prettier (must be 0 problems)
npm run format      # ESLint --fix + Prettier --write
npm run typecheck   # tsc --noEmit (must be clean)
npm run prebuild    # expo prebuild (native code generation)
```
Quick sanity that everything still compiles/bundles: `npx expo export --platform android`.

## Known gaps / gotchas

- **14 legacy `.js` files remain** un-migrated (most of `constants/`, `stores/useAuthStore.js` + `useDevStore.js`, `context/NotificationContext.jsx`, `theme/palette.js`). `checkJs` is off, so they aren't type-checked. **`theme/palette.js` must stay `.js`** (`tailwind.config.js` `require`s it).
- Counting `tsc` errors from a script: use `npx tsc --noEmit --pretty false 2>&1 | grep -c "error TS"` — colorized output hides "error TS" from grep.
- `ProfileForm`, `GuestForm`, `OtherMumukshuForm`, `useQuickImagePicker` are **shared** across features (profile/booking/events/onboarding) — they live in `components/`/`hooks/`, not inside a feature.
- Some `src/components/booking*` folders had spaces in their names historically — codemods over the tree need null-safe handling (or Python), not naive `xargs`.
