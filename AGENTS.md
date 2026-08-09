# AGENTS.md

Aashray is the member-facing app for SRATRC. Members book stays, meals, travel,
adhyayan and utsav, and pay through Razorpay.

## Expo SDK 56 — read the versioned docs

Read `https://docs.expo.dev/versions/v56.0.0/` before writing Expo code. Do not
write from memory of an older SDK. React Native 0.85, New Architecture and
bridgeless, Hermes, React Compiler on. Every other version is in `package.json` —
read it there, do not restate it.

## Commands

```bash
npm run start       # Expo dev server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator
npm run lint        # ESLint + Prettier check
npm run format      # ESLint --fix + Prettier --write
npm run prebuild    # expo prebuild (native code generation)
```

No test framework is configured. There are no tests to run.

## Metro dies on save

The NativeWind watcher crashes Metro on save (`Cannot read properties of
undefined (reading 'addedFiles')`). Batch edits, then restart — fast refresh does
not survive a save. A crashed Metro keeps holding 8081, silently pushing the
restart to 8082 and serving a stale bundle. Kill the port first.

## Things that are easy to get wrong

### The backend decides, the app displays

`aashray-backend` owns pricing, availability, validation, status transitions,
credits and refunds. When the app and the backend disagree, the backend is right.
Never re-derive one of its rules in the app.

### Surfaces come from a token

`src/constants/surfaces.js` owns `PAGE`, `CARD` and `CARD_FLAT`. Eight places
still hand-roll `rounded-2xl border border-gray-200 bg-white`. Use the token. Do
not add a ninth.

### Buttons carry their visible text as their id

`CustomButton` sets both `testID` and `accessibilityLabel` from its `text` prop
(`const id = testID ?? text`). Keep that on new buttons. Screen readers and the
UI driver both depend on it.

### `eslint --fix` strands `@ts-ignore`

`import/order` moves an import and leaves its `@ts-ignore` comment behind,
pointing at the wrong line. After a format run, diff the tsc error lines, not the
error count.

## Architecture

Only the parts the directory tree does not already show.

- **Onboarding gate order** — no user → needs profile picture → needs profile →
  fully onboarded. Guards use `Stack.Protected` in `src/app/_layout.tsx`.
- **`src/utils/preparingRequestBody.js`** turns booking-store state into the API
  payload for all six booking types. The highest-risk pure function in the app.
- **`src/utils/HandleApiCall.js`** is the only Axios wrapper. `devPrNumber` in
  `useDevStore` points it at a PR-specific backend.
- **State split** — Zustand (`src/stores/`) for client state, persisted to MMKV.
  TanStack Query for server state: stale 5 min, gc 30 min, no refetch on focus,
  mount or reconnect.
- **Component defaults** — bottom sheets (`@gorhom/bottom-sheet`) instead of full
  modals. `FlashList` instead of `FlatList`. Shimmer components for skeletons.
- **Deep links** are declared in `src/config/deeplinks.ts`.
