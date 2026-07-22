# CLAUDE.md

Guidance for Claude Code working in this repo. **Read `ARCHITECTURE.md` for the full factual reference** (structure, data layer, design system, flows). This file is the short, high-signal version + the hard rules.

## Style

When reporting to me, be extremely concise and sacrifice grammar for concision. No filler.

## What this is

`aashray-app` — member-facing React Native / Expo client for SRATRC. Bookings (room/flat/food/travel), events (adhyayan/utsav), WiFi codes, support tickets, payments. **The backend (`aashray-backend`) is the source of truth for all business logic** — verify behavior/types against it, not this client. Auth is **cardno-based** (no JWT); every request carries `cardno`.

**Stack:** RN 0.85 · Expo SDK 56 · Expo Router 6 · TypeScript (strict) · NativeWind · React Query 5 · Zustand + MMKV · axios (via `apiClient`) · Sentry · Razorpay · react-native-sse.

## Commands

```bash
npm run start | ios | android    # dev / simulators
npm run lint        # ESLint + Prettier — MUST be 0 problems
npm run format      # eslint --fix + prettier --write
npm run typecheck   # tsc --noEmit — MUST be clean
npm run prebuild    # expo prebuild
```
No test framework yet. Sanity-check a change bundles: `npx expo export --platform android`.

## How the code is organized (feature-sliced)

- `src/app/` — Expo Router routes ONLY. Route files are **thin re-exports** of a feature screen (`export default ScreenFromFeatureBarrel`). `_layout.tsx` stays.
- `src/features/<domain>/` — where real code lives: `screens/ components/ hooks/ api.ts types.ts index.ts`. Domains: auth, onboarding, wifi, support, contact, menu, maintenance, profile, events (adhyayan+utsav), payments, booking.
- `src/lib/` — infra: `api/client.ts` (the one HTTP client `apiClient`), `api/types.ts`, `api/resolveBaseUrl.ts`, `queryClient.ts`, `storage.ts`, `wifiCache.ts`.
- `src/components/` — shared UI; `src/components/ui/` — owned design primitives (Text, Button).
- `src/theme/` — `palette.js` (single color source) + `tokens.ts`. `src/stores/` — Zustand (auth, booking, dev). `src/hooks/ constants/ config/ utils/` — shared.

## Hard rules (enforced)

- **Data access:** every network call goes through `apiClient` (`@/lib/api/client`) or a feature `api.ts` React Query hook. **No direct `axios`** outside `lib/api/client.ts`. (Two intentional exceptions: `RazorpayCheckout.open` and `react-native-sse` — leave them.) The old `handleAPICall` is gone; don't reintroduce it.
- **Feature boundaries:** import a feature via its barrel `@/features/<name>` — **never** a deep `@/features/<name>/<internals>` path. Barrels use explicit named exports (**no `export *`**).
- **Alias:** `@/*` → `src/*`.
- **Types:** keep `tsc` clean; no `any` on API boundaries — type against the backend.
- **Lint:** keep `npm run lint` at 0 problems.
- **Colors:** never hard-code hex in a component — use NativeWind token classes or `palette` from `@/theme/tokens` (all colors originate in `src/theme/palette.js`).

## Conventions (expected)

- New screen → in a feature (`features/<domain>/screens/`), route file is a thin re-export via the barrel.
- New endpoint → add to the feature's `api.ts` (hook + key factory) with a backend-accurate type in `types.ts`.
- Preserve exact request/response + store-push shapes when refactoring — `useBookingStore` + `preparingRequestBody` couple by shape (untyped), and Razorpay/SSE flows are behavior-sensitive.
- `ProfileForm`, `GuestForm`, `OtherMumukshuForm`, `useQuickImagePicker` are shared (used across features) — they stay in `components/`/`hooks/`, not inside a feature.

## Gotchas

- Count `tsc` errors with `--pretty false` (`npx tsc --noEmit --pretty false 2>&1 | grep -c "error TS"`) — colorized output hides "error TS" from grep.
- `theme/palette.js` must stay `.js` (tailwind `require`s it). ~14 legacy `.js` files remain (`checkJs` off).
- Deep-link routes live in `src/config/deeplinks.ts`; FCM push auto-navigates from payloads.
