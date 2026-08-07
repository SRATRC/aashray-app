# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Driving the running app (metro-mcp)

Connected over CDP. Verify UI changes with it instead of asserting from a screenshot.

| Need | Tool |
|------|------|
| Tap a button | `tap_element` by the button's **visible label** |
| Confirm what a tap did | `get_current_route`, `get_navigation_state` |
| Jump to a screen | `open_deeplink` — `aashray:///book-now?type=room` |
| Type / scroll | `type_text`, `swipe`, `long_press` |
| API payload or response | `get_network_requests`, `get_request_details`, `get_response_body` |
| Errors / logs | `get_errors`, `get_console_logs`, `get_bundle_errors` |
| Screenshot | `xcrun simctl io <udid> screenshot <path>`, then Read it |

Tap works because `CustomButton` sets `testID`/`accessibilityLabel` from its visible
text. Keep that for new buttons. `tap_element` fails honestly, so "Tapped X" is real.

**Do not trust these — they return empty instead of failing:** `list_elements`,
`get_testable_elements`, `find_components`, `get_component_tree`, `inspect_at_point`,
`audit_accessibility`. Their fiber walk stops ~20 levels above our screens, so they
report absence, not truth (`audit_accessibility` claims a clean bill on a screen with
almost no labels). Filed as steve228uk/metro-mcp#68; `take_screenshot` size as #69.

Zustand stores are module-scoped, so `evaluate_js` cannot reach them off `globalThis`.

To identify an on-screen element, RN's `getInspectorDataForViewAtPoint` plus Metro
`/symbolicate` does reach screen content, unlike the tools above. React 19 dropped
`_debugSource` from fibers, so resolve the file and line by symbolicating the
`componentStack` frames rather than reading them off the fiber.

**agent-device** (XCUITest) co-exists — no contention. Use it only for what the OS
owns: gestures, system dialogs, Razorpay sheet, permissions, keyboard.

## Metro

The NativeWind watcher crashes Metro on save (`Cannot read properties of undefined
(reading 'addedFiles')`). Batch edits, then restart — fast refresh does not survive a
save. A crashed Metro keeps holding 8081, silently pushing the restart to 8082 and
serving a stale bundle. Kill the port first.

## Architecture

**Aashray** is a spiritual retreat booking app for Vitraag Vigyan organization. It handles room/travel/food bookings, spiritual events (adhyayan, utsav), WiFi access codes, and payments.

**Stack**: React Native + Expo + expo-router (file-based routing), New Architecture /
bridgeless, Hermes, React Compiler on. TypeScript/JS mixed codebase, NativeWind
(Tailwind CSS). Versions live in `package.json` — read it there, do not restate it here.

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
