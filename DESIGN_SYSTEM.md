# Aashray Design System — "Sanctuary"

**Status:** v1.0 (spec / not yet implemented) · **Owner:** Aashray app · **Companion doc:** [`UI_UX_AUDIT.md`](./UI_UX_AUDIT.md)

> **Read this first — for humans _and_ AI agents.**
> This file is the single source of truth for how the Aashray UI looks, feels, and is built. It is written to be **machine-actionable**: every rule is explicit ("always / never"), every token has a name and value, and every component has a contract. Any AI agent modifying UI **must load this file first** and build strictly in-system. If a value you need isn't here, you **add a token** — you never hardcode. See §13 "AI Operating Guide" for the exact workflow.

---

## Table of contents
1. [Aesthetic north star](#1-aesthetic-north-star)
2. [Architecture & file layout](#2-architecture--file-layout)
3. [Governance & golden rules](#3-governance--golden-rules)
4. [Design tokens](#4-design-tokens)
5. [Typography](#5-typography)
6. [Iconography](#6-iconography)
7. [Imagery](#7-imagery)
8. [Motion & haptics](#8-motion--haptics)
9. [Voice & content](#9-voice--content)
10. [Component contracts](#10-component-contracts)
11. [Platform rules (iOS / Android)](#11-platform-rules-ios--android)
12. [Accessibility requirements](#12-accessibility-requirements)
13. [AI operating guide](#13-ai-operating-guide)
14. [Adoption roadmap & migration map](#14-adoption-roadmap--migration-map)
15. [Changelog & versioning](#15-changelog--versioning)

---

## 1. Aesthetic north star

Aashray is the stay-booking app for a Shrimad Rajchandra / Jain spiritual retreat. Users span young seekers to elderly devotees and guests. The product's job is calm, trustworthy hospitality — booking a stay, a study (adhyayan), a festival (utsav), meals, travel — for a *devotional* context, not a hotel.

**Quality bar:** Airbnb-grade smoothness, whitespace, and polish.
**Identity ("taste"):** *Sanctuary* — the feeling of a retreat at dawn. Warm, serene, editorial, reverent.

**The one deliberate risk:** a **warm humanist serif (Fraunces) for headings** in a booking app. Utility apps default to all-sans "safe grotesk," which is why they feel interchangeable. The serif reads as manuscript/scripture, signals reverence, and is friendlier to older devotees. Everything around that one move stays quiet and disciplined — **the restraint is the taste.**

**Three rules that carry the identity:**
- **Saffron is sacred.** The saffron accent touches **only the single primary action** on any screen. Never use it for decoration, selection chrome, or more than one CTA per view.
- **Warm, never cold.** Backgrounds are warm paper; shadows are ink-tinted, not gray; success/error hues are warmed (sage, brick), never neon.
- **Calm motion.** Unhurried springs and gentle fades. Nothing bouncy or playful.

**Signature elements** (used sparingly, high-impact moments only): a fine **mandala-derived hairline motif** and a **"dawn" paper→faint-saffron gradient**, on the home hero and success/confirmation screens.

---

## 2. Architecture & file layout

Five layers, each depending only on the ones above it. **Never skip a layer** (e.g. a screen never reads a raw hex; it uses a component, which uses a token).

```
Tokens  →  Primitives  →  Components  →  Patterns  →  Screens
```

```
src/design/
  tokens/
    palette.ts        # raw hex ramps — PRIVATE, never imported by app code
    color.ts          # semantic tokens (light + dark maps) — THE source of truth
    spacing.ts radius.ts elevation.ts motion.ts zindex.ts
    typography.ts     # variant → {family,size,lineHeight,weight,tracking}
    index.ts
  theme/
    ThemeProvider.tsx  # resolves colorScheme → active semantic tokens
    useTheme.ts        # hook: const t = useTheme(); t.color.text.primary
  primitives/          # Text, Box, Stack, Touchable, Icon
  components/          # Button, Field, Card, Sheet, Dialog, Chip, Tag, Badge,
                       # Segmented, ListRow, Skeleton, EmptyState, Toast, Header
  patterns/            # ScreenScaffold, FormScaffold, BookingStepScaffold,
                       # ConfirmationScaffold
  icons/               # SVG icon components + registry (name → component)
  gallery/             # dev-only "kitchen sink" route rendering every component/state
  index.ts             # public barrel — app imports from '@/src/design'

tailwind.config.js     # imports tokens; does NOT define colors/spacing itself
```

**Token ↔ Tailwind parity:** `tailwind.config.js` is generated from `src/design/tokens`, so NativeWind classes map to the same semantic tokens (`bg-canvas`, `text-primary`, `border-default`, `bg-accent`, `p-4` = space-4). Result: whether code uses `className` or `useTheme()`, there is **one** source of values. Raw hex in `colors.js` (old) and per-file hex are removed (see migration map §14).

**Documentation surface:** the `gallery/` route is the living, runnable catalog — every component in every state. Big-company hallmark: the design system is *demonstrable*, not just described.

---

## 3. Governance & golden rules

These are enforced (lint + PR checklist) and are **non-negotiable for AI agents**.

**NEVER:**
- ❌ Raw hex / rgba in `src/app` or `src/components` (or anywhere outside `tokens/palette.ts`). Use a semantic token.
- ❌ Raw `fontSize`/`fontFamily`/`fontWeight`. Use `<Text variant=…>`.
- ❌ `TouchableOpacity` / `TouchableHighlight` for new code. Use `<Touchable>`.
- ❌ Hand-rolled bottom sheets or `Animated.timing` sheets. Use `<Sheet>` (built on `@gorhom/bottom-sheet`).
- ❌ Raw `Modal` for confirmations/alerts. Use `<Dialog>`.
- ❌ `Dimensions.get()` at module scope, or hardcoded layout widths/heights. Use `useWindowDimensions`, flex, and `aspectRatio`.
- ❌ `allowFontScaling={false}`. Font scaling stays on (cap with `maxFontSizeMultiplier` on controls only).
- ❌ `useNativeDriver:false` `Animated` for new work. Use Reanimated (UI thread).
- ❌ Arbitrary spacing/radius values (`mt-[13px]`, `borderRadius: 17`). Pick a token.
- ❌ A new color/space/radius value inline. **Add a token** (see §13 recipe) instead.

**ALWAYS:**
- ✅ Load this doc before UI work; build via the layer stack (§2).
- ✅ Every interactive element: min touch target (44pt iOS / 48dp Android), `accessibilityRole` + `accessibilityLabel`, press feedback + haptic (via `<Touchable>`/`<Button>`).
- ✅ Every component ships all states: default, pressed, disabled, loading, error/empty where relevant.
- ✅ Respect reduce-motion and dark mode via tokens/`useTheme`.
- ✅ Update this doc **and** the `gallery/` in the same PR as any token/component change.

**Definition of Done (any component or screen):** uses only tokens · all states present · a11y labels + targets · reduce-motion honored · renders in light + dark · added to `gallery/` · documented in §10 · `npm run lint` passes the "no raw values" rule.

**Suggested lint enforcement:** an ESLint rule banning hex-color string literals and `TouchableOpacity` imports outside `src/design/`, plus `eslint-plugin-tailwindcss` for arbitrary-value warnings.

---

## 4. Design tokens

### 4.1 Raw palette (`tokens/palette.ts` — private)
| Ramp | Token | Hex |
|---|---|---|
| Paper | paper-50 / 100 / 200 | `#FCFAF4` / `#FAF6EE` / `#F4EEE0` |
| Sand | sand-100 / 200 / 300 | `#EFE7D6` / `#E7DEC9` / `#D9CDB2` |
| Ink | ink-900 / 700 / 500 / 300 | `#211C15` / `#4A4235` / `#7A7060` / `#A99E8B` |
| Saffron | saffron-50 / 100 / 500 / 600 / 700 | `#FBEFD9` / `#F6DCA9` / `#E0952A` / `#C57E1E` / `#A66614` |
| Clay | clay-50 / 500 / 600 | `#F7E7E0` / `#B45B3E` / `#9A4A30` |
| Sage | sage-50 / 500 / 600 | `#E9EEE3` / `#6E8063` / `#566A4C` |
| Brick (error) | brick-50 / 500 | `#F6E3E0` / `#B23A2E` |
| Honey (warning) | honey-50 / 500 | `#FAEBCD` / `#B8801C` |
| Slate (info) | slate-50 / 500 | `#E7EDF1` / `#5B7286` |

### 4.2 Semantic tokens (`tokens/color.ts` — the source of truth)
App code uses **only** these. Dark values are provisional for the v1.1 fast-follow — verify contrast before shipping dark.

| Semantic token | Light | Dark (v1.1, provisional) |
|---|---|---|
| `bg/canvas` | `#FAF6EE` | `#16130D` |
| `bg/surface` | `#FFFDF8` | `#1E1A12` |
| `bg/surfaceRaised` | `#FFFFFF` | `#241F16` |
| `bg/sunken` | `#F4EEE0` | `#100E09` |
| `bg/tint` (accent tint) | `#FBEFD9` | `#2A2212` |
| `text/primary` | `#211C15` | `#F3ECDD` |
| `text/secondary` | `#4A4235` | `#C8BFAC` |
| `text/muted` | `#7A7060` | `#9A9079` |
| `text/disabled` | `#A99E8B` | `#6A6250` |
| `text/inverse` | `#FCFAF4` | `#16130D` |
| `text/accent` (links/accent text) | `#A66614` | `#E8A63E` |
| `border/subtle` | `#EFE7D6` | `#2A2318` |
| `border/default` | `#E7DEC9` | `#332C20` |
| `border/strong` | `#D9CDB2` | `#463C2C` |
| `accent/default` | `#E0952A` | `#E8A63E` |
| `accent/pressed` | `#C57E1E` | `#C57E1E` |
| `accent/tint` | `#FBEFD9` | `#2A2212` |
| `accent/onAccent` (text/icon on accent) | `#211C15` | `#16130D` |
| `status/success` / `success-bg` | `#566A4C` / `#E9EEE3` | `#8FA383` / `#20271A` |
| `status/error` / `error-bg` | `#B23A2E` / `#F6E3E0` | `#E0705F` / `#2A1613` |
| `status/warning` / `warning-bg` | `#B8801C` / `#FAEBCD` | `#D9A83E` / `#2A2012` |
| `status/info` / `info-bg` | `#5B7286` / `#E7EDF1` | `#8AA3B5` / `#141B20` |
| `overlay/scrim` | `rgba(33,28,21,0.45)` | `rgba(0,0,0,0.6)` |
| `focus/ring` | `#C57E1E` | `#E8A63E` |

> **Contrast note:** `accent/default` (#E0952A) fails text contrast on light, so **button text on saffron is `accent/onAccent` (dark ink), not white** — this is elegant *and* accessible. For accent-colored text/links use `text/accent` (#A66614).

### 4.3 Spacing (`tokens/spacing.ts`) — 4pt base
`space-0`=0 · `1`=4 · `2`=8 · `3`=12 · `4`=16 · `5`=20 · `6`=24 · `7`=32 · `8`=40 · `9`=48 · `10`=64.
Screen horizontal padding = `space-4` (16). Section gap = `space-6` (24). Card padding = `space-4`.

### 4.4 Radius (`tokens/radius.ts`)
`sm`=8 (tags, small inputs) · `md`=12 (buttons, inputs) · `lg`=16 (cards, list containers) · `xl`=24 (hero cards, bottom-sheet top corners) · `pill`=999 (chips, pills, avatars). No other radii.

### 4.5 Elevation (`tokens/elevation.ts`) — warm, ink-tinted
| Token | Use | iOS shadow (color `ink-900`) | Android |
|---|---|---|---|
| `e0` | flush | none | elevation 0 |
| `e1` | cards | opacity .06, radius 12, y 4 | elevation 2 |
| `e2` | sheets, menus, toast | opacity .10, radius 20, y 8 | elevation 6 |
| `e3` | dialogs, modals | opacity .14, radius 28, y 12 | elevation 12 |

### 4.6 Motion (`tokens/motion.ts`)
Durations: `fast`=150 · `base`=220 · `slow`=300 · `deliberate`=420 (ms).
Easing: `standard` = cubic-bezier(0.2,0,0,1); `decelerate`; `accelerate`.
Springs: `gentle` {damping 18, stiffness 180, mass 1} · `snappy` {damping 20, stiffness 260}.
Press feedback: scale `0.98`, opacity `0.92`. Content reveal: fade + translateY `8–12`px over `base`.

### 4.7 Z-index (`tokens/zindex.ts`)
base 0 · raised 10 · sticky 20 · header 30 · scrim 40 · sheet 50 · modal 60 · toast 70 · tooltip 80.

### 4.8 Device / responsive
Baseline small phone 360×640. Content max-width **600** (center on tablet/large). Use `useWindowDimensions`, flex, `aspectRatio`; never fixed layout px. Honor `react-native-edge-to-edge` insets.

---

## 5. Typography

**Families** (retire Poppins & DMSerifDisplay):
- **Display — Fraunces** (warm humanist serif). Weight to ship: SemiBold (Bold optional). Use for `display`/`title` **only**. *(Add TTFs — OFL licensed.)*
- **Body/UI — DM Sans** (already loaded). Weights: Regular 400, Medium 500, **SemiBold 600** *(add)*.
- **Data (optional) — DM Mono** for tabular amounts/receipts.

**Scale (`tokens/typography.ts`)** — `variant: size / lineHeight / weight / family / tracking`
| variant | size | line | weight | family | tracking | use |
|---|---|---|---|---|---|---|
| `display` | 34 | 40 | SemiBold | Fraunces | -0.5 | hero, confirmation |
| `title` | 26 | 32 | SemiBold | Fraunces | -0.3 | screen H1 |
| `headline` | 20 | 26 | SemiBold | DM Sans | -0.2 | section H2 |
| `subtitle` | 17 | 24 | Medium | DM Sans | 0 | card titles |
| `body` | 15 | 22 | Regular | DM Sans | 0 | default text |
| `bodyStrong` | 15 | 22 | Medium | DM Sans | 0 | emphasis |
| `callout` | 16 | 24 | Regular | DM Sans | 0 | readable paragraphs |
| `caption` | 13 | 18 | Regular | DM Sans | 0 | meta, helper |
| `label` | 12 | 16 | Medium | DM Sans | +0.6 (UPPERCASE) | overlines, tags |
| `button` | 16 | 20 | SemiBold | DM Sans | 0 | button label |

**Rules:** serif (`display`/`title`) is reserved for reverent moments — **never** serif for body or controls. Always `<Text variant=…>`; never inline font styles. `maxFontSizeMultiplier` ≈ 1.4 on buttons/labels; uncapped on body/callout.

---

## 6. Iconography

Replace **all raster PNG icons** with an **SVG line set** (recommend `lucide-react-native`, 1.5px stroke) plus custom domain icons (adhyayan, room, food, travel, utsav) hand-drawn to match: 24px grid, 1.5 stroke, rounded joins/caps.
- Sizes: `16 / 20 / 24 / 28`. Default `24`.
- Color = a text/accent token (default `text/primary`; `accent/default` only when active/selected).
- Access via `<Icon name="…" />` mapped through `icons/registry`. This unlocks tinting for active + dark states for free (impossible with today's PNGs).

---

## 7. Imagery

Warm natural light; real ashram / nature / architecture (no cold stock). Consistent warm grade. Corner radius `lg` (16), no harsh drop shadow. For text-over-image, apply `overlay/scrim`. Aspect ratios: hero 16:9, cards 4:3, avatars 1:1.

---

## 8. Motion & haptics

**Motion:** calm and unhurried. New animations use Reanimated on the UI thread. Buttons/chips press → scale `0.98` + opacity `0.92`. Content reveals with fade + `8–12`px rise over `base` (220ms). Sheets/segmented/expanders use spring `gentle`. Expand/collapse animates height + opacity (never instant `display:none`). Respect reduce-motion (disable reveal/scale when `AccessibilityInfo.isReduceMotionEnabled`).

**Haptics** (via `expo-haptics`, both platforms, subtle):
| Trigger | Haptic |
|---|---|
| Primary/secondary button press, chip select | `impactAsync(Light)` |
| Segmented / picker change | `selectionAsync()` |
| Booking / payment / feedback **success** | `notificationAsync(Success)` |
| Validation error / payment **failure** | `notificationAsync(Error)` |

Baked into `<Touchable>`/`<Button>`/`<Chip>` — so haptics are automatic and consistent, not per-screen. Success/error haptics fire in `ConfirmationScaffold` (fixes the audit gap where only Razorpay fired haptics).

---

## 9. Voice & content

Warm, plain, respectful — hospitality in a devotional space. Sentence case. Active voice.
- **Buttons name the action & keep the name through the flow:** "Confirm stay" → toast "Stay confirmed". "Pay ₹1,200" (show the amount). Not "Submit".
- **Empty states invite:** e.g. "No bookings yet — your next stay will appear here." + a CTA.
- **Errors direct, don't apologize:** say what happened + how to fix, in the app's voice, with a retry. Never a bare API string.
- Lean into the warm register the sign-in already has ("Jai Sadgurudev Vandan") — but keep functional copy crisp.

---

## 10. Component contracts

Compact contracts — enough for an AI to implement consistently. Props shown are the meaningful ones; all extend sensible RN props. All live under `src/design`.

### Primitives
- **`<Text variant color? align? numberOfLines?>`** — variant drives all type (§5); `color` from `text/*` tokens. No raw font styles.
- **`<Box>` / `<Stack direction gap p px py …>`** — layout with token spacing (`gap`/`p` = space tokens). Optional convenience over NativeWind classes.
- **`<Touchable onPress haptic='light'|'selection'|'none' disabled hitSlop accessibilityRole='button' accessibilityLabel>`** — the ONLY tappable primitive. iOS: scale/opacity press; Android: `android_ripple`. Enforces min 44/48 target. Everything tappable composes this.
- **`<Icon name size=24 color=text/primary strokeWidth=1.5>`** — from the SVG registry (§6).

### Components
- **`<Button variant='primary'|'secondary'|'tertiary'|'destructive' size='sm'|'md'|'lg' fullWidth loading disabled leadingIcon trailingIcon onPress>`** — min height 48, radius `md`. primary = `accent/default` bg + `accent/onAccent` label; secondary = `bg/surface` + `border/default` + `text/primary`; tertiary = text-only `text/accent`; destructive = `status/error`. Built-in light haptic. `loading` swaps label for spinner, preserves width. Replaces the 3 button implementations.
- **`<Field label value onChangeText placeholder helperText error leadingIcon trailingAction secureToggle keyboardType returnKeyType onSubmitEditing autoFocus>`** — label always visible on top. States: default / **focus** (border `accent/default` + `focus/ring`, driven by `onFocus` state — **not** NativeWind `focus:`) / error (border `status/error` + error helper) / disabled. iOS `clearButtonMode`. Forwards `ref` for scroll-to-error. a11y label + error announced.
- **`<Card variant='plain'|'interactive' onPress?>`** — `bg/surface`, `border/subtle`, radius `lg`, `e1`, padding `space-4`. `interactive` composes `<Touchable>`.
- **`<Sheet snapPoints|detents header footer onClose>`** — built on `@gorhom/bottom-sheet` **only**. Drag handle, `overlay/scrim` backdrop, keyboard-aware, safe-area bottom, sticky `footer` for CTA. **All** bottom sheets use this. Replaces `CustomSelectBottomSheet`, `UpdateModal` sheet.
- **`<Dialog title message actions>`** — centered confirm/alert. Radius `xl`, `e3`, scrim, max-width 400, safe-area aware. Replaces `CustomModal`, `CustomAlert`. Use only for **blocking** decisions.
- **`<Chip label selected onPress disabled leadingIcon>`** — pill; selected = `accent/tint` bg + `accent/default` border + `text/primary`; press scale + light haptic. Single primitive; replaces `CustomChipGroup` + `AnimatedChipGroup`.
- **`<Tag label tone='neutral'|'success'|'warning'|'error'|'info' size>`** — non-interactive status label from status tokens. `<Badge count>` for counts.
- **`<Segmented options value onChange>`** — animated pill via Reanimated spring `gentle`; `selectionAsync` on change.
- **`<ListRow leading title subtitle trailing onPress?>`** — min height 56; `border/subtle` divider; press feedback if navigable; trailing chevron/value/switch.
- **`<Skeleton>`** + `SkeletonLine/Box/Circle` — **real shimmer** via Reanimated gradient sweep. Screens compose layout-matching skeletons. **No full-screen spinners for content.** Replaces `Shimmer` (which only pulsed).
- **`<EmptyState illustration? title message primaryAction? secondaryAction? variant='empty'|'error'>`** — one component for empty **and** error (error adds retry). Replaces `CustomEmptyMessage`, `CustomErrorMessage`, `ErrorFallback` divergence.
- **`<Toast>`** — wraps `react-native-toast-message`; variants success/error/info. Placement per platform (Android bottom = snackbar-like; iOS top banner). Use for **non-blocking** confirmations; reserve `<Dialog>` for blocking.
- **`<Header title subtitle? variant='push'|'modal' leading? trailing? large?>`** — **pinned**, safe-area aware via `useSafeAreaInsets`. `push` = back chevron; `modal` = X close; `large` = iOS collapse-on-scroll. Replaces `PageHeader` + all ad-hoc headers.

### Patterns (scaffolds)
- **`<ScreenScaffold header scroll systemBarStyle>`** — safe-area frame + pinned `<Header>` + scrollable content; sets `SystemBars` style to match the bg (fixes global "always dark icons"); handles edge-to-edge. Every screen uses this.
- **`<FormScaffold>`** — `KeyboardAwareScrollView` (via `react-native-keyboard-controller`), **scroll-to-first-error**, sticky footer CTA. All forms use this (kills the mixed `KeyboardAvoidingView` usage).
- **`<BookingStepScaffold step total onBack onNext>`** — persistent progress (step x/total), reversible, preserves state, confirms before discarding a partially-filled step.
- **`<ConfirmationScaffold status='success'|'failure' receipt actions>`** — illustration + **mini-receipt** (amount, booking id, dates) + success/error haptic + dawn-gradient/mandala signature + clear next action. Fixes the "no receipt / no haptic on confirmation" audit gaps.

---

## 11. Platform rules (iOS / Android)

| Area | iOS (HIG) | Android (Material 3) |
|---|---|---|
| Nav title | large title, collapse on scroll | top app bar (small/center) |
| Back | full-screen edge swipe (`fullScreenGestureEnabled`) | predictive back gesture |
| Selection UI | `<Sheet>` with **detents** (medium/large), grabber | Material bottom sheet, drag handle |
| Primary create action | inline "+" in header | **circular elevated FAB** |
| Touch feedback | scale/opacity | **ripple** (`android_ripple`) |
| Transient message | top banner Toast | bottom snackbar-style Toast |
| Tab bar | translucent blur, home-indicator inset | tonal surface, **no hard border**, gesture-nav inset |
| Surfaces | soft shadow | tonal elevation (not borders) |
| Touch target | 44pt min | 48dp min |
| Type scaling | Dynamic Type | font scale |

`<Touchable>`, `<Sheet>`, `<Header>`, `<Toast>` already branch internally — screens don't hand-write platform code. When a component needs a fork, use `Platform.select` inside the component or a `.ios.tsx`/`.android.tsx` file **within `src/design`**, never in a screen.

---

## 12. Accessibility requirements

- Icon-only controls (close, password eye, call, copy): `accessibilityRole="button"` + `accessibilityLabel`.
- `hitSlop` on any target under the size minimum (baked into `<Touchable>`).
- Font scaling **on**; cap controls at ~1.4×, uncapped body. Never `allowFontScaling={false}`.
- Contrast ≥ WCAG AA: enforced by tokens (dark text on saffron; `text/accent` for accent text; muted text ≥ 4.5:1 on canvas).
- Visible focus ring (`focus/ring`) on inputs.
- Respect reduce-motion (§8).

---

## 13. AI operating guide

**This section makes the system self-managing for future AI sessions.**

**On any UI task, in order:**
1. Load this file + `UI_UX_AUDIT.md`.
2. Check `src/design` for an existing token/primitive/component/pattern that fits.
3. Compose from existing pieces. If something's missing, extend the system (recipes below) — **never** one-off it in a screen.
4. Run the §3 golden rules as a checklist before finishing.

**Decision tree — "I need to render…"**
- text → `<Text variant>` · a tap → `<Touchable>`/`<Button>` · a surface/card → `<Card>` · pick-one-from-list → `<Sheet>` of options or `<Segmented>` · a toggleable filter/tag → `<Chip>` · a status label → `<Tag>` · a form → `<FormScaffold>` + `<Field>` · a whole screen → `<ScreenScaffold>` · transient confirmation → `<Toast>` · blocking confirmation → `<Dialog>` · a loading state → layout-matched `<Skeleton>` (never a bare spinner) · empty/error → `<EmptyState>`.

**Recipe — add a screen:** wrap in `<ScreenScaffold>` with a `<Header>`; use tokens/components only; add loading `<Skeleton>`, empty/error `<EmptyState>`; verify light+dark, both platforms, reduce-motion; a11y labels on icon buttons.

**Recipe — add a component to the system:** create in `src/design/components`; token-only values; implement all states (§3 DoD); add haptics/a11y via `<Touchable>`; export from `src/design/index.ts`; **add a story to `gallery/`**; **document its contract in §10**; ensure lint passes.

**Recipe — add/change a token:** edit only `src/design/tokens/*`; add both light + dark values; update the table in §4/§5; regenerate Tailwind mapping; grep for any now-duplicate hardcoded value and replace with the token. Never introduce a color/space/radius outside `tokens/`.

**Recipe — add an icon:** add the SVG to `src/design/icons`, register `name → component` in the registry, use `<Icon name>`. Match 24px grid, 1.5 stroke.

**Forbidden (auto-reject in review):** raw hex, raw font styles, `TouchableOpacity`, hand-rolled sheet/modal, `Dimensions.get()` at module scope, hardcoded layout px, `allowFontScaling={false}`, `useNativeDriver:false` for new animations, adding a value that should be a token, editing a component without updating `gallery/` + §10.

**Keeping this doc true:** every PR that changes a token or component **must** update this file in the same PR. Treat §4, §5, and §10 as the contract; if code and doc disagree, that's a bug.

---

## 14. Adoption roadmap & migration map

Sequenced to match `UI_UX_AUDIT.md` phases — foundation first (it unblocks and de-risks everything).

- **Phase 0 — Foundation:** build `src/design/tokens` + `theme` + Tailwind parity; `<Text>`, `<Touchable>`, `<Icon>`, `<Button>`, `<Field>`; add Fraunces + DM Sans SemiBold, remove Poppins; stand up `gallery/`; add lint rules.
- **Phase 1 — Motion & feel:** `<Touchable>` press + haptics everywhere; real `<Skeleton>`; Reanimated springs for `<Segmented>`/`<Chip>`/expanders; intentional stack transitions.
- **Phase 2 — Components & flows:** `<Sheet>`/`<Dialog>` consolidation; `<Header>` + `<ScreenScaffold>`; `<FormScaffold>` inline validation + scroll-to-error; `<BookingStepScaffold>` progress; `<ConfirmationScaffold>` receipt + haptics; `<EmptyState>`; `<Toast>` for confirmations.
- **Phase 3 — Platform & inclusivity:** Android FAB/ripple/tonal tab bar/edge-to-edge/snackbar; iOS large titles/sheet detents/Dynamic Type; PNG→SVG icons; **dark mode** (token swap); full a11y pass.

**Migration map (old → new):**
| Old | New |
|---|---|
| `CustomButton`, `CustomAlert` buttons, `ShadowBox` interactive, `ErrorFallback` buttons | `<Button>` |
| `PageHeader` + ad-hoc headers | `<Header>` + `<ScreenScaffold>` |
| `CustomModal`, `CustomAlert` | `<Dialog>` |
| `CustomSelectBottomSheet`, `UpdateModal` sheet | `<Sheet>` |
| `CustomChipGroup`, `AnimatedChipGroup` | `<Chip>` |
| `Shimmer` | `<Skeleton>` |
| `CustomEmptyMessage`, `CustomErrorMessage`, `ErrorFallback` | `<EmptyState>` |
| `src/constants/colors.js` + inline hex + `tailwind` colors | `src/design/tokens` |
| Poppins, DMSerifDisplay | Fraunces + DM Sans |
| raster PNG icons | SVG `<Icon>` |

---

## 15. Changelog & versioning

Semver. Any breaking token/component change bumps the version and is logged here.
- **v1.0** — Initial "Sanctuary" spec: tokens, type, motion, components, patterns, AI operating guide. Not yet implemented.
