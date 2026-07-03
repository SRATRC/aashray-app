# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Aashray is the stay-booking app for a Shrimad Rajchandra / Vitraag Vigyan (Jain) spiritual retreat. It handles room/travel/food bookings, spiritual events (adhyayan, utsav), WiFi access codes, and payments.

## Style

When reporting information to me, be extremely concise and sacrifice grammar for the sake of concision.

## Before ANY UI work — load the design system

**Read [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) first.** It is the single source of truth for the UI ("Sanctuary" design system) and is machine-actionable — tokens, component contracts, and an "AI Operating Guide" (§13) with decision trees + recipes. Build strictly in-system. Current-state gap analysis: [`UI_UX_AUDIT.md`](./UI_UX_AUDIT.md). Per-screen/per-component redesign plan: [`REDESIGN_PLAN.md`](./REDESIGN_PLAN.md). UX research & principles (density/information-scent): [`UX_RESEARCH.md`](./UX_RESEARCH.md). Explorable mockups: `design-preview/index.html`.

**UI golden rules (full list + rationale in DESIGN_SYSTEM.md §3):**

- **Never** hardcode a hex color, font size/family, spacing, or radius. Use a token from `src/design/tokens`; if it's missing, **add a token** — don't inline a value.
- **Never** use `TouchableOpacity`, a hand-rolled bottom sheet, or a raw `Modal` in new code. Use `<Touchable>`, `<Sheet>` (on `@gorhom/bottom-sheet`), `<Dialog>`.
- **Always** use `<Text variant=…>` for text and compose from `src/design` (Tokens → Primitives → Components → Patterns → Screens). Never skip a layer.
- **Always** ship every state (default/pressed/disabled/loading/empty/error), a11y labels + min touch targets, reduce-motion, and light+dark.
- **Always** update `DESIGN_SYSTEM.md` + the `src/design/gallery/` catalog in the same PR as any token/component change. If code and doc disagree, that's a bug.

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

**Stack**: React Native 0.85 + Expo SDK 56 + Expo Router (file-based routing), TypeScript/JS mixed codebase, NativeWind (Tailwind CSS), Reanimated 4.

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
- Deep link routes configured in `src/config/deeplinks.ts`

## Codebase exploration

This project has a knowledge graph — prefer the `code-review-graph` MCP tools (`semantic_search_nodes`, `query_graph`, `get_impact_radius`, `detect_changes`) over Grep/Glob/Read for structural exploration; fall back to file tools only when the graph doesn't cover what you need.
