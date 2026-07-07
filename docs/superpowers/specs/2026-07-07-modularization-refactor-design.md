# Aashray App — Modularization & Maintainability Refactor

**Date:** 2026-07-07
**Status:** Approved (direction) — pending spec review
**Branch:** `worktree-refactor-modularization` (from `main`)

## Problem

The app works but is hard to change safely and inconsistently built. Concrete, measured issues in the current `src/` (177 source files):

- **Fractured styling / no consistency.** Four parallel systems: NativeWind `className` (105 files), a JS `colors` constant (50 files), **159 inline hex colors**, and `StyleSheet.create` (10 files). Colors are defined **twice** with different values — `constants/colors.js` and `tailwind.config.js`.
- **Split-brain data layer.** A callback-style `handleAPICall` wrapper is called directly in **42 files**; React Query is used in **31 files**. Two competing fetch patterns, and the callback style fights React Query's promise model.
- **God files.** e.g. `utsav/[id].tsx` (1281 lines), `pendingPayments.tsx` (984), `adhyayan/[id].tsx` (971), `EventsBooking.tsx` (894), `RoomBooking.tsx` (875) — each mixes data fetching, multiple form states, handlers, and layout, with heavy `any` typing.
- **One mega store.** `useBookingStore` holds room/travel/food/adhyayan/utsav/flat/guest/mumukshu together with defensive try/catch throughout.
- **Type-organized, not feature-organized.** Booking logic is scattered across `app/`, `components/booking`, `components/booking addons`, `components/cancel booking`, `stores`, `utils/preparingRequestBody`.
- **JS/TS mix.** 19 legacy `.js` files in core spots (stores, api wrapper, request-body prep, notification context). Folder names contain spaces (`booking addons`, `cancel booking`, `booking details cards`).

**Root user need (verbatim intent):** *"if a piece of code is written once, I should be able to just use it anywhere without worrying about consistency."* → reuse + consistency, plus fewer bugs and faster feature work.

## Goals

1. **Consistency** — one token source, one set of UI primitives, one data-fetching pattern.
2. **Fewer bugs** — backend-accurate TypeScript types everywhere; single, predictable data path.
3. **Modularization/reuse** — feature-sliced structure with shared `lib/` and `components/ui/`; each unit has one clear purpose and a well-defined interface.
4. **Perfectly linted** — `npm run lint` passes clean at the end of every phase; ESLint config is strengthened to enforce the new boundaries.

## Non-goals

- No automated tests written now (structure is made test-ready; tests are a later phase — user's call).
- No switch away from NativeWind (no Tamagui/gluestack); no new heavyweight UI dependency.
- No feature/behavior changes — this is a structural refactor; user-visible behavior stays identical.
- No unrelated dependency upgrades beyond what the refactor needs.

## Decisions (from research — settled, not re-litigated)

- **Architecture:** feature-based. `src/app/` = routing only (thin route files that render a feature screen). Real code in `src/features/*`.
- **Design system:** own thin primitives on top of NativeWind, seeding patterns from react-native-reusables (copy-in code, no runtime dep). One token layer feeds both `tailwind.config` and primitives.
- **Data layer:** one promise-based typed axios client in `lib/`; per-feature `api.ts` with query-key / `queryOptions` factory exporting **only** hooks. React Query is the single fetch path.
- **State:** keep a bounded store per domain via Zustand **slices**; always use selectors; `partialize` MMKV persistence.
- **JS→TS:** incremental, `allowJs: true`, leaves-first, ratchet `strict` at the end.
- **Path aliases / barrels:** standardize `@/*` → `src/*`; avoid deep/wildcard barrels (`export *`). Small, explicit feature-public re-exports only if useful.
- **Testing:** `jest-expo` + `@testing-library/react-native` + `expo-router/testing-library` — scaffold only, in Phase 4.

## Target structure

```
src/
  app/              # routes ONLY — each file thinly renders a feature screen
  features/
    <domain>/
      screens/      # real screen component (moved out of app/)
      components/   # domain-only components
      hooks/        # domain logic extracted from god files
      api.ts        # React Query hooks + query-key factory (only backend access for the domain)
      store.ts      # domain Zustand slice (if it needs client state)
      types.ts      # backend-accurate request/response types
  components/ui/    # owned design-system primitives (Button, Text, Input, Card, Sheet, Chip, Modal…)
  theme/            # ONE token source (colors/spacing/typography) — feeds tailwind + primitives
  lib/              # typed axios client, QueryClient, MMKV storage, notifications, deeplinks
```

**Domains:** `auth`, `onboarding`, `profile`, `services` (wifi/maintenance/menu/contact/support), `booking` (stay+food+travel+flat incl. guest/mumukshu variants, review, validation, `preparingRequestBody`), `events` (adhyayan+utsav), `payments` (pending/transactions/razorpay).

## Shared conventions (the "write once, reuse anywhere" contract)

- **Tokens:** never hard-code a hex or raw spacing value in a component. Reference semantic tokens (via `className` or the theme module). `tailwind.config` colors are generated from the token source.
- **UI:** screens compose primitives from `components/ui/` + domain components. No new ad-hoc `Custom*` component when a primitive exists.
- **Data:** a screen/component never calls axios or `handleAPICall` directly — it calls a hook from the domain's `api.ts`. Query keys come from the domain's key factory.
- **Types:** request/response types derive from `aashray-backend` (`models/`, `controllers/`) and `docs/business-logic/`; no `any` on API boundaries.
- **State:** access stores through selectors; each domain owns its slice.
- **Lint:** ESLint enforces import boundaries (no cross-feature deep imports; features may import `lib/`, `components/ui/`, `theme/` but not each other's internals) and forbids reintroducing `handleAPICall` / inline hex once migrated.

## Phases

Each phase ends with: app runs, behavior unchanged, **`npm run lint` clean**, committed.

### Phase 1 — Shared foundation
- **Tokens:** merge `constants/colors.js` + `tailwind.config.js` into one semantic token source in `theme/`; generate tailwind colors from it. Begin retiring inline hex / `StyleSheet` (opportunistically + a sweep in Phase 4).
- **UI primitives:** build `components/ui/` (Button, Text, Input, Card, Sheet, Chip, Modal, etc.), consolidating the ~40 sprawling `Custom*` components, seeded from react-native-reusables patterns.
- **lib/ infra:** promise-based typed axios client (replaces `handleAPICall` internals: base-URL/dev-PR logic, interceptors, Sentry breadcrumbs, toast/haptic on error), central QueryClient config, MMKV storage wrapper; relocate notifications + deeplinks into `lib/`.
- **Guardrails:** standardize `@/*` → `src/*` alias (one-time codemod of imports), `allowJs: true` + `checkJs` where cheap, strengthen ESLint (import boundaries, `no-restricted-imports`), dead-code sweep.

### Phase 2 — Prove the pattern (template domain)
- Fully migrate one small domain end-to-end (WiFi or Maintenance) into `features/<x>/` with `screens/`, `api.ts` (React Query hooks + backend types), thin `app/` route.
- This is the reference implementation. **Reviewed & approved before scaling.**

### Phase 3 — Domain-by-domain migration (repeatable loop)
For each domain, **in one pass** (touch the file once), do all of:
- Move into `features/<domain>/`; thin the `app/` route.
- Convert direct `handleAPICall` → typed React Query hooks in `api.ts`.
- Break god screens: extract logic into hooks, then split JSX into section components.
- Slice its state out of the mega `useBookingStore`.
- Migrate its JS→TS; replace `any` with backend-accurate types.

**Order (value/risk):** `services` → `profile` → `events` → `payments` → `booking` (biggest/riskiest last). Each domain ships & is verified independently.

### Phase 4 — Consolidate & ratchet
- Delete legacy `handleAPICall`; remove old dirs (incl. space-named `booking addons/`, `cancel booking/`, `booking details cards/`); remove dead/wildcard barrels.
- Ratchet TypeScript `strict` flags to fully on (`noImplicitAny` → `strictNullChecks` → `strict`).
- Final consistency sweep (remaining inline hex / `StyleSheet`).
- Scaffold `jest-expo` + RNTL + `expo-router/testing-library` (no tests written yet).

## Verification (per phase)

1. App builds and runs (`expo start`, exercise the affected flows on simulator).
2. `npm run lint` clean (ESLint + Prettier).
3. TypeScript typecheck clean for migrated files.
4. Behavior of migrated flows manually confirmed unchanged.

## Risks & mitigations

- **Import churn from alias/move.** Do it as mechanical codemods; lint + typecheck catch stragglers; one domain at a time in Phase 3.
- **Backend types drift from reality.** Derive from backend source + business-logic docs; verify against `aashray` DB-schema MCP and actual responses where unsure.
- **Booking is the riskiest domain** (mega store + `preparingRequestBody` + guest/mumukshu variants). It goes last, after the pattern is proven and every other domain is done.
- **Silent behavior change during god-file breakup.** Extract without rewriting logic; keep diffs mechanical and reviewable.

## Out of scope / deferred

- Writing the actual test suite.
- Migrating to ESLint flat config / `eslint-config-expo` (optional; only if it eases the boundary rules).
- Any UI/UX redesign.
