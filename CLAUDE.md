# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Style

When reporting information to me, be extremely concise and sacrifice grammar for the sake of concision.

## Commands

```bash
npm run start       # Expo dev server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator
npm run lint        # ESLint + Prettier check
npm run format      # ESLint --fix + Prettier --write
npm run prebuild    # expo prebuild (native code generation)
```

No test framework is configured.

## Architecture

**Aashray** is a spiritual retreat booking app for Vitraag Vigyan organization. It handles room/travel/food bookings, spiritual events (adhyayan, utsav), WiFi access codes, and payments.

**Stack**: React Native 0.79 + Expo 54 + Expo Router 6 (file-based routing), TypeScript/JS mixed codebase, NativeWind (Tailwind CSS).

### Navigation Structure (`src/app/`)

Expo Router file-based routing with these route groups:

- `(auth)/` — login, signup, password reset
- `(onboarding)/` — image capture, profile completion
- `(tabs)/` — main tab bar (home, profile, bookings)
- `(home)/` — home screens (menu, WiFi, maintenance, payments)
- `(payment)/` — Razorpay payment flows
- `booking/`, `guestBooking/`, `mumukshuBooking/` — booking management by user type
- `adhyayan/`, `utsav/` — event details/feedback

Auth guards use `Stack.Protected` for conditional navigation. Onboarding checks: no user → needs PFP → needs profile → fully onboarded.

### State Management

- **Zustand** (`src/stores/`) for client state — `useAuthStore.js` (persisted to MMKV), `useBookingStore.js` (room/travel/food/adhyayan/utsav/flat/guest/mumukshu booking data), `useDevStore.js` (backend switching)
- **TanStack React Query** for server state — stale time 5 min, GC time 30 min, no refetch on focus/mount/reconnect
- **MMKV** for encrypted local persistence

### API Layer

`src/utils/HandleApiCall.js` — Axios wrapper with:

- Base URL from `EXPO_PUBLIC_BASE_URL` / `EXPO_PUBLIC_DEV_BASE_URL` env vars
- Dynamic PR-specific backend via `devPrNumber` in dev store
- Request/response logging, toast error notifications, haptic feedback on errors

`src/utils/preparingRequestBody.js` — normalizes booking store state into API payloads before submission.

### Key Integrations

- **Razorpay** — payment processing
- **Firebase/FCM** — push notifications with auto-navigation from notification payloads
- **Sentry** — error tracking

### Component Patterns

- Bottom sheets (`@gorhom/bottom-sheet`) instead of full modals
- `FlashList` for optimized list rendering
- Shimmer loading components for skeletons
- React Compiler enabled (experimental)
- Deep link routes configured in `src/config/deeplinks.ts`
