# Aashray — AI agent guide

Aashray is the stay-booking app for a Shrimad Rajchandra / Jain spiritual retreat (Dharampur). Users book stays (rooms/flats), study programs (adhyayan), festivals (utsav), meals, and travel; the audience spans young seekers to elderly devotees, so calm and legibility matter.

**Stack:** Expo SDK 56 · React Native 0.85 · React 19 (New Architecture / Fabric) · expo-router (file-based) · NativeWind v4 · Reanimated 4 · @gorhom/bottom-sheet 5 · @shopify/flash-list · @tanstack/react-query · zustand + react-native-mmkv · Firebase messaging · Sentry · Razorpay · expo-notifications / expo-haptics · react-native-keyboard-controller.

## Commands

```bash
npm start          # Metro / Expo dev server (dev-client)
npm run ios        # prebuild + pod install + build + launch iOS dev build
npm run android    # same for Android
npm run web        # expo web — NOTE: native-only modules at the root can break web
npm test           # jest (jest-expo + @testing-library/react-native)
npm run lint       # eslint + prettier --check
npm run format     # eslint --fix + prettier --write
npm run prebuild   # regenerate native ios/ + android/ from config
```

- This is a **dev-client** build (custom native modules) — plain Expo Go won't run it.
- `ios/` and `android/` are **prebuild-generated / gitignored**; a fresh checkout (or worktree) has none until `expo prebuild` or `expo run:*`.

## Architecture

- **`src/app/`** — expo-router routes. Groups: `(auth)` sign-in · `(onboarding)` complete-profile / image-capture · `(tabs)` home / book-now / bookings / profile · `(home)` menu / support / wifi / pending-payments / maintenance · `(payment)` confirmation screens. Plus feature stacks `booking`, `guestBooking`, `mumukshuBooking`, `adhyayan`, `utsav`, `profile`. `gallery.tsx` = dev-only design-system catalog (`__DEV__`, route `aashray://gallery`).
- **Auth / onboarding gating** lives in `src/app/_layout.tsx` via `Stack.Protected` guards from `useAuthStore`: `userExists` → onboarding (`needsPfp`, `needsProfileCompletion`) → `isFullyOnboarded`. Signed-out users land on `(auth)/sign-in`.
- **State:** `src/stores/` (zustand — `useAuthStore`, `useBookingStore`, `useDevStore`; persisted with MMKV). Server state via react-query.
- **API:** all network calls go through `src/utils/HandleApiCall.js`.
- **Other dirs:** `src/components/` (legacy UI, being migrated to the design system), `src/design/` (design system — see below), `src/context/` (NotificationContext), `src/hooks/`, `src/constants/`, `src/config/`, `src/questions/` (feedback forms), `src/assets/`.

## UI / design system — read `DESIGN_SYSTEM.md` before ANY UI work

The **"Sanctuary"** design system lives in **`src/design/`** and is the single source of truth for UI. `DESIGN_SYSTEM.md` is machine-actionable (tokens, component contracts, and an "AI Operating Guide" in §13 with decision trees + recipes); `UI_UX_AUDIT.md` is the current-state gap analysis. Import from `@/src/design`.

Rollout is phased (§14). **Phase 0 shipped:** tokens, theme (`ThemeProvider` / `useTheme`), primitives (`Text`, `Touchable`, `Icon`), `Button`, `Field`, and the `/gallery` catalog. `Sheet`, `Dialog`, `Header`, scaffolds, dark mode, and the icon/font cleanup are later phases — don't assume they exist yet; check `src/design/index.ts`.

Golden rules (full list + rationale in §3; eslint enforces the first two under `src/design/**`):
- **Never** hardcode a hex/rgba, font size/family, spacing, or radius — use a token from `src/design/tokens`; if it's missing, **add a token**.
- **Never** use `TouchableOpacity`, a hand-rolled bottom sheet, or a raw `Modal` in new UI — use `<Touchable>` / `<Sheet>` (@gorhom) / `<Dialog>`.
- **Always** use `<Text variant=…>` and compose Tokens → Primitives → Components → Patterns → Screens (never skip a layer).
- **Always** ship every state (default/pressed/disabled/loading/empty/error), a11y label + min touch target (44pt iOS / 48dp Android), reduce-motion, and light+dark.
- Update `DESIGN_SYSTEM.md` §10 + the `src/design/gallery/` catalog in the **same PR** as any token/component change. If code and doc disagree, that's a bug.

## Codebase exploration

Prefer the **`code-review-graph` MCP tools** (`semantic_search_nodes`, `query_graph`, `get_impact_radius`, `detect_changes`) over Grep/Glob/Read for structural exploration; fall back to file tools only when the graph doesn't cover what you need.

## Environment

`.env.local` provides `EXPO_PUBLIC_BASE_URL`, `EXPO_PUBLIC_DEV_BASE_URL`, `EXPO_PUBLIC_RAZORPAY_KEY_ID`, `EXPO_PUBLIC_SENTRY_DSN` (+ `GOOGLE_SERVICES_JSON` / `GOOGLE_SERVICES_PLIST`). Firebase configs: `google-services.json`, `GoogleService-Info.plist`. Template in `.env.example`.

## Gotchas (non-obvious — these will bite you)

- **No `StrictMode`** around the root navigator — it double-mounts in dev and breaks the expo-router splash.
- **Don't toggle `display: none ↔ flex`** on a mounted Fabric subtree — it SIGABRTs on SDK 56. Conditionally mount/unmount instead.
- **Version floors:** `react-native-razorpay` **≥ 3.0.0** (2.x won't link on New Arch); `@gorhom/bottom-sheet` **≥ 5.2.14** (5.2.6 crashes every sheet on SDK 56).
- **iOS pods / Firebase:** the Podfile needs `ios.useFrameworks: "static"` (set via `expo-build-properties`). If `pod install` fails with *"Swift pods cannot be integrated as static libraries" / GoogleUtilities does not define modules*, the prebuild wrote an incomplete `ios/Podfile.properties.json` — re-run `npx expo prebuild -p ios`, then `pod install`.
- **Cold iOS builds are slow** — `buildReactNativeFromSource: true` compiles RN from source. If `pod install` says *"no spec satisfying …"*, the CocoaPods trunk cache is stale → `pod repo update`.
- **Never `allowFontScaling={false}`** — it breaks iOS Dynamic Type / accessibility.

## Companion docs

- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — the design system (read before UI work).
- [`UI_UX_AUDIT.md`](./UI_UX_AUDIT.md) — prioritized UI/UX gap analysis + per-platform (iOS HIG / Android Material 3) guidance.
- `docs/superpowers/plans/` — implementation plans (e.g. the design-system rollout).
