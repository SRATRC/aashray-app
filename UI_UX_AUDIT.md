# Aashray — UI/UX Audit & Roadmap to Airbnb-Grade Polish

**Branch audited:** `feat/utsav-feedback-form` @ `614245e` · **Worktree:** `.claude/worktrees/ui-audit`
**Stack:** Expo SDK 56, RN 0.85, React 19, expo-router, NativeWind, Reanimated 4, gesture-handler, @gorhom/bottom-sheet 5, FlashList, react-query, zustand.
**Goal:** Make the app feel as smooth and aesthetic as Airbnb, with correct per-platform (iOS HIG / Android Material 3) behavior.

> How to read this: findings are tagged **P0 / P1 / P2** (impact on the "smooth + aesthetic" goal, not just bug severity). The single biggest lever is **Section 2 (Design System)** — most screen-level drift is a symptom of not having one. Section 9 is the phased plan.

---

## 1. What's already good (protect these)

These are genuinely close to the target — use them as the internal templates:

- **`sign-in.tsx`** — uses `react-native-keyboard-controller` with a Reanimated spring that tracks the OS keyboard curve on the UI thread. Clean type, generous spacing, single accent. This is the quality bar for the rest of the app.
- **`SteppedFeedback/`** — real progress bar, tuned slide+fade (220–260ms), skeleton shimmer, success screen. Best-executed flow.
- **`adhyayan/[id].tsx` & `utsav/[id].tsx`** — skeleton on load, dedicated error view with "Try again", pull-to-refresh. This is the correct loading/error pattern; copy it to the booking flow.
- **`menu.tsx`** — color-coded meal accents, skeleton matching final layout, "Today" indicator. (Only flaw: it's raw StyleSheet instead of NativeWind — see §2.)
- **`contactInfo.tsx`** — tap-to-call + long-press-to-copy with haptic + toast confirmation. Good micro-interaction model.

---

## 2. Foundation: the Design System (P0 — root cause of ~60% of findings)

Almost every "inconsistent radius / color / spacing / shadow" finding below traces back to there being **no enforced design system**. Fix this first; it makes everything else cheaper and prevents regression.

### 2.1 One source of truth for tokens (P0)
Colors are currently defined **twice** and have already drifted:
- `tailwind.config.js` (`secondary #F1AC09`, green/red scales) **and** `src/constants/colors.js` (`orange`, `zinc_100`, no green/red).
- Screens *also* hardcode hex: tab bar `#FFA001` / border `#EEAA0B` (`(tabs)/_layout.tsx`), dev switch `#FF9C01` (`profile.tsx`), local `colors` object inside `QrModal.tsx`.
- **Fix:** define tokens once (in `tailwind.config.js`) and derive the JS `colors` object from the same values. Ban raw hex in `src/app`/`src/components` via an eslint rule. Reserve **gold (`secondary`)** for primary CTAs only — right now it doubles as selection/checkbox/badge/active color, which causes "accent fatigue" and weakens its call-to-action meaning.

### 2.2 Spacing / radius / type scale (P0)
The app mixes NativeWind (`rounded-xl/2xl/3xl`, `text-sm/base/lg/xl/2xl`) with raw StyleSheet pixel values (`menu.tsx`, `contactInfo.tsx` use 14/16/18/24/28px and ad-hoc 4/8/12/16/20 spacing). Within a *single* screen (`profile.tsx`) cards use `rounded-2xl` **and** `rounded-3xl`; modals use `borderRadius: 24/28/32` literals elsewhere.
- **Fix:** adopt a strict **4/8pt spacing scale** and **two radii only** (12 for chips/buttons/inputs, 16 for cards/sheets; full for avatars). Define a **type scale** (e.g. display / title / body / caption mapped to specific size+weight+lineHeight) and migrate the two raw-StyleSheet screens onto NativeWind so there's one styling path.
- **Add a `<Text>` wrapper** (`Typography` component with `variant` prop). Today the only wrapper is `ErrorText`; everything else relies on repeating `className="font-pregular text-sm ..."`, which is why sizes drift.

### 2.3 Dark mode (P1 — platform expectation)
There is **no dark mode at all** (0 uses of `useColorScheme` / `dark:` / `Appearance`). Both iOS and Android users expect it, and Airbnb ships it. `SystemBars style="dark"` is hardcoded globally in `_layout.tsx` and never varied.
- **Fix:** once tokens are centralized, add semantic tokens (`surface`, `onSurface`, `border`, `muted`…) and a light/dark map. This is a large effort — schedule after the token refactor, but design the token layer *now* so dark mode is a config swap, not a rewrite.

### 2.4 Iconography: raster → vector (P1 — aesthetics)
All 60 domain icons are **PNG** (`src/assets/icons/*.png`); only 1 file uses `react-native-svg`. Raster icons don't scale crisply across densities, can't be tinted (so can't adapt to dark mode or selected/active states), and look soft next to Airbnb's vector iconography.
- **Fix:** convert the icon set to SVG (or use a consistent icon font). This unlocks tinting for active/dark states for free. Also standardize the back chevron — currently FontAwesome5 `chevron-left`, which matches neither the iOS SF-Symbol chevron nor Material `arrow_back`.

### 2.5 Typography families (P2)
Three families loaded: **Poppins (9 weights)** + **DMSans (3)** + **DMSerifDisplay**. That's 13 font files at startup and two competing sans-serifs (Poppins vs DMSans) used for body text.
- **Fix:** pick **one** sans (body/UI) + keep DMSerif for hero/brand moments only. Drop unused Poppins weights. Fewer, deliberate weights = tighter, more Airbnb-like type.

---

## 3. Motion & Smoothness (P0/P1 — the core of "smooth like Airbnb")

The app *has* Reanimated 4 + worklets installed but **barely uses them** (1 file imports Reanimated; **0** files use `entering`/`exiting`/layout transitions). Almost all motion is either absent or on the JS thread.

- **P0 — No press feedback / no ripple.** 54 files use `TouchableOpacity`; only 10 use `Pressable`. Chips use `activeOpacity={1}` (literally no feedback — `CustomChipGroup.tsx:33`). Android gets **no ripple anywhere**, so it reads as an iOS port.
  - **Fix:** standardize on `Pressable` with a small scale-down + opacity on iOS and `android_ripple` on Android, wrapped in one primitive. This alone makes the whole app feel "alive."
- **P0 — Haptics are almost entirely missing.** `CustomButton` (the most-used component) fires **zero** haptics; haptics exist only on the Razorpay callback (`bookingReview.tsx`) and a few random components (AddonItem, ExpandableItem, QrModal). The free-booking/pay-later success path reaches the confirmation screen with no haptic at all.
  - **Fix:** light impact on primary button tap and selection (chips/toggles); success/error notification haptics on every confirm/validation-failure — not just Razorpay.
- **P1 — Animations run on the JS thread.** `AnimatedChipGroup` and `SegmentedControl` use `Animated` with `useNativeDriver: false` (layout/translateX) and `Animated.timing` (linear, robotic). `CustomSelectBottomSheet` / `UpdateModal` slide sheets with `Animated.timing`, not spring.
  - **Fix:** migrate to Reanimated 4 `useAnimatedStyle` + `withSpring` (already a dependency) for UI-thread, spring-based motion.
- **P1 — Expand/collapse snaps.** `ExpandableItem`/`AddonItem` toggle via `display: none/flex` with no height/opacity animation — instant pop.
  - **Fix:** animated height + fade (Reanimated `LinearTransition`/layout).
- **P1 — No screen/shared-element transitions.** Root Stack sets no `animation`; only `(auth)` uses `fade` and `utsav` uses `presentation: 'modal'`. Everything else is a default push. No card→detail hero transitions (Airbnb leans on these heavily).
  - **Fix:** set intentional per-platform stack animation, use `presentation: 'modal'`/`formSheet` for reviews/confirmations, enable `fullScreenGestureEnabled` for full-swipe-back on iOS, and add shared-element transitions on the highest-traffic card→detail jump.
- **P2 — Skeletons aren't real shimmers.** `Shimmer.tsx` only applies NativeWind `animate-pulse` (a pulse, not a moving highlight). Loading is spinner-heavy overall (21 files use `ActivityIndicator` vs 8 using Shimmer).
  - **Fix:** a real Reanimated gradient sweep, and prefer layout-matching skeletons over full-screen spinners everywhere (home, booking addons, lists).

---

## 4. Components (P0/P1 — consolidation)

The library has **multiple parallel implementations of the same thing**, which is the source of most visual drift:

- **P0 — Four incompatible modal/sheet systems.** `CustomModal` + `CustomAlert` (RN Modal, centered), `UpdateModal` (RN Modal + hand-rolled spring, platform-forked JSX), `CustomSelectBottomSheet` (RN Modal + `Animated.timing`, manually reimplements drag handle/backdrop/keyboard — no swipe-to-dismiss) **vs** `BottomSheetFilter` / `ChargeBreakdownBottomSheet` (real `@gorhom/bottom-sheet` with proper snap points, backdrop, pan-to-close).
  - **Fix:** rebuild `CustomSelectBottomSheet` and `UpdateModal` on `@gorhom/bottom-sheet` so all sheets share native drag physics, keyboard avoidance, and detents. Backdrop opacity is currently arbitrary (0.4/0.5/0.6 per component) — tokenize it; consider a `BlurView` backdrop (only `QrModal` uses one today).
- **P0 — Three button implementations** (`CustomButton`, inline buttons in `CustomAlert`, `ShadowBox` interactive, raw buttons in `ErrorFallback`) with drifting radius, disabled opacity (0.45/0.5/none), and press feedback (0.6/0.7/0.8/0.85). No min touch target baked in (some are 40px, below 44pt iOS / 48dp Android).
  - **Fix:** one `Button` with `variant`/`size`, min-height enforced, haptics + ripple built in.
- **P1 — Two shadow systems.** `ShadowBox` has a proper `sm/md/lg/xl` token set, but `CustomModal`/`CustomAlert`/`FormDisplayField`/`UpdateModal` hardcode their own `shadowOpacity/elevation` objects with inconsistent iOS↔Android values.
  - **Fix:** route all elevation through `ShadowBox` tokens (or an `elevation` prop).
- **P1 — `FormField`.** Focus state relies on `focus:border-secondary` NativeWind pseudo-class, which is unreliable/no-op on RN TextInput — **verify it actually renders; if not, drive border via `onFocus` state + animated color**. No `returnKeyType`/`onSubmitEditing` (no Done/Next keyboard flow between fields), no iOS `clearButtonMode`. `isLoading` shows plain "Verifying..." text instead of a spinner. Two label treatments (`default` vs `clean`) with no shared spec.
- **P1 — Empty/error components** are inconsistent: `CustomEmptyMessage` (illustration, no CTA), `CustomErrorMessage` (plain Ionicon, no CTA), `ErrorFallback` (full retry/home actions). Some screens (`maintenanceRequestList`) use a bare `<Text>` error with no retry.
  - **Fix:** one composable empty/error component with optional illustration + primary CTA; use everywhere.
- **P2 — Chips.** `CustomChipGroup` and `AnimatedChipGroup` are two implementations of one concept; unify on a base chip primitive with real press feedback.

---

## 5. Screen-by-screen (highest-impact, condensed)

**Home (`(tabs)/index.tsx`) — P0.** Opens with a logo row + fixed `min-h-[220px]` quote banner. No search/booking entry, no "upcoming booking / credits" status. Feels static, not like a dashboard. Hardcoded banner/logo dimensions won't scale on SE/Pro-Max/tablet. Quick-access grid is 6 identical 76px tiles with no hierarchy (WiFi as prominent as Book Now). Full-screen spinner instead of a skeleton. `allowFontScaling={false}` breaks Dynamic Type.
- **Fix:** real hero + "Book your stay" primary CTA card + status card; promote 1–2 primary quick actions, demote the rest; aspect-ratio sizing; skeleton on load; remove `allowFontScaling={false}`.

**Booking flow (`booking/`, `guestBooking/`, `mumukshuBooking/`) — P0 (highest-stakes, weakest).**
- No step/progress indicator (Details → Add-ons → Review → Pay). Add one (reuse `SteppedFeedback/ProgressBar`).
- Validation is **on-submit only, via blocking `CustomAlert`** — user fills 4 accordions, taps Continue, gets a generic "Please fill all the room fields" with no pointer to the offending field. **Fix:** inline field errors + auto-scroll/expand to first invalid section (keyboard-controller is already present, so scroll-to-error is nearly free).
- Continue button is never disabled pre-submit (always looks tappable, then fails).
- Validation-error modal's only action is "Okay" → `router.back()` — a transient network blip destroys the whole flow. **Add a "Retry".**
- Add-ons section swaps to a centered spinner during `isValidating` (`[booking].tsx:418-426`) → layout jump. Use a fixed-height skeleton.
- **Zero toasts anywhere** despite `react-native-toast-message` being installed — every confirmation is either silent or a blocking modal. Introduce toasts for non-blocking confirmations ("Guest added").

**Payment/confirmation (`(payment)/*`) — P1.** Animations are nice, but confirmation shows **no receipt** (no amount, booking ID, or dates) — user must tap through to see what they paid for. Airbnb always shows a mini-receipt on success. Add it. Success/fail screens fire no haptic themselves.

**Bookings / Book-Now tabs — P1.** Inconsistent radii (chips `rounded-[12px]` vs cards `xl/2xl/3xl`); chip active state has no press feedback; no shared skeleton across the 6 booking categories → risk of inconsistent loading per type.

**Profile — P1.** Avatar hardcoded `h-[150] w-[150]` (oversized on small phones, missing `px` unit is fragile). Edit button `h-9 w-9` = 36pt, below the 44pt iOS minimum. Mixed radii in one scroll.

**Pending Payments — P1.** Card is over-dense (icon + title + amount + timer badge + 3–4 metadata rows + pill + checkbox). Timer badge absolutely positioned at `-right-1 -top-1` clips the corner radius. **Fix:** progressive disclosure — card shows title/amount/date/status; details behind a tap. Good empty-state copy already.

**WiFi / Support / Maintenance — P2.** `PageHeader` scrolls away inside the ScrollView (should stay pinned). Support has no character counter for its 10-char-min field (error only on submit). Maintenance uses a square `rounded-2xl` "FAB" with no elevation — wrong on both platforms (see §6). Some screens use raw `Alert` where the rest use Toast — inconsistent feedback channel.

---

## 6. Navigation & App Shell (P1)

- **Headers are hand-rolled 3 different ways.** Every layout sets `headerShown: false`, so 100% of headers are custom: (1) `PageHeader` (chevron-left, no border) in ~15 screens; (2) ad-hoc bordered bars with a right-side "X" (`utsav/dailySchedule.tsx`, `utsavGuidelines.tsx`); (3) no header. This forfeits native large-title (iOS) and Material top-app-bar (Android) behavior for free, and guarantees drift.
  - **Fix:** extend `PageHeader` with `rightSlot`, `subtitle`, and a `variant="modal"` (X close), make it **safe-area-aware via `useSafeAreaInsets`** (today it uses a fixed `mt-6` and depends on the parent `SafeAreaView` — a fragile hidden contract), keep it **pinned** above the ScrollView (today it scrolls with content), and retire the ad-hoc headers.
- **Tab bar.** iOS gets `position: absolute` + `BlurView`; Android gets a flat `#FFFCF5` bar with a **1px orange top border** (dated vs Material 3 tonal elevation), and `TabBarBackground.tsx` (Android) is a no-op so Android has no translucency. Active/inactive colors are hardcoded hex. Edge-to-edge is enabled (`edgeToEdgeEnabled: true`) but the Android tab bar height doesn't clearly account for gesture-nav insets.
  - **Fix:** drop the Android border, use tonal surface/elevation; verify tab-bar insets under `react-native-edge-to-edge`; pull tint colors from tokens.
- **Splash.** `_layout.tsx` gates hide on fonts+auth **plus an unconditional 200ms `setTimeout`** — guaranteed dead time on every cold launch. Use `SplashScreen.setOptions({ fade: true })` and hide the instant content is ready.
- **Status bar.** Global `SystemBars style="dark"` never varies — dark/photo-hero screens risk invisible dark icons. Audit those and set `style="light"` locally.

---

## 7. Per-Platform Playbook (what "correct for each platform" means)

Airbnb keeps a **shared brand language** but respects platform *gestures, chrome, and feedback*. Concretely:

### iOS (Human Interface Guidelines)
- **Navigation:** large titles that collapse to inline on scroll; full-screen edge-swipe back (`fullScreenGestureEnabled`); thin SF-Symbol chevron.
- **Sheets:** native sheet presentation with a grabber and **detents** (medium/large) for reviews, filters, pickers — instead of hand-rolled centered modals.
- **Tab bar:** translucent blur (already done), respect the home-indicator safe area.
- **Feedback:** `UIImpactFeedback` (light on selection, success/error notification haptics); **selection tick** haptic on pickers/segmented controls.
- **Type:** support **Dynamic Type** (remove `allowFontScaling={false}`, add sensible `maxFontSizeMultiplier`).
- **Motion:** interruptible springs; context menus on long-press for cards.

### Android (Material 3)
- **Navigation:** Material top app bar (small/center/large); **predictive back** gesture; **edge-to-edge** with `SystemBars` insets applied to content and the tab bar.
- **Primary action:** a **circular, elevated FAB** for "create" (e.g., new maintenance request) — not a square button; on iOS prefer an inline header "+".
- **Feedback:** **ripple** on every touchable (`android_ripple`); **Snackbar** anchored bottom instead of iOS-style banners.
- **Surfaces:** tonal elevation, **no hard 1px borders**; optional Material You dynamic color.
- **Touch targets:** 48dp minimum (vs 44pt iOS).
- **Motion:** Material motion patterns — fade-through for tabs, shared-axis for step flows, container-transform for card→detail.

### Cross-platform Airbnb principles to adopt
Generous whitespace + strong imagery + minimal chrome · one accent used sparingly · **soft-shadow cards at 12–16 radius** · **skeletons, never spinners** · **sticky bottom CTA showing price** in flows · progressive disclosure · consistent micro-interactions (press scale + haptic) · bottom-sheet-driven selection.

---

## 8. Accessibility (P1 — also required for App Store / Play polish)

Currently near-zero: **1 file** uses any `accessibilityLabel/Role`, **0** use `maxFontSizeMultiplier`, and **3** use `allowFontScaling={false}` (which actively breaks Dynamic Type).
- **Fix:** add `accessibilityRole`/`accessibilityLabel` to all icon-only buttons (close X, password-eye, call, copy); add `hitSlop` consistently (only 5 files have it); allow font scaling with a cap; ensure gold-on-white and gray text meet WCAG contrast (the gold `#F1AC09` on white is borderline for small text).

---

## 9. Prioritized Roadmap

**Phase 0 — Foundation (unblocks everything; do first)**
1. Single token source (colors/spacing/radius/type) in `tailwind.config.js`; derive JS `colors`; eslint-ban raw hex. (§2.1–2.2)
2. `Typography` (`<Text>`) + `Button` + `Pressable`-based touchable primitives with haptics + ripple + min touch target baked in. (§3, §4)
3. Migrate the two raw-StyleSheet screens (`menu`, `contactInfo`) onto NativeWind.

**Phase 1 — Motion & feel (highest "smooth" ROI)**
4. Replace `TouchableOpacity`→`Pressable` primitive app-wide; add press-scale + haptics. (§3)
5. Move chip/segmented/sheet animations to Reanimated springs; animate expand/collapse. (§3)
6. Skeletons instead of spinners on home, booking add-ons, lists; make `Shimmer` a real sweep. (§3, §5)
7. Intentional stack transitions + `formSheet` for reviews/confirmations + full-swipe-back. (§3, §6)

**Phase 2 — Components & flows**
8. Consolidate all sheets/modals onto `@gorhom/bottom-sheet`; tokenize backdrop. (§4)
9. Booking flow: step indicator, inline validation + scroll-to-error, disable-until-valid, retry on error, toasts for confirmations. (§5)
10. Unify empty/error component with CTA; standardize headers via extended `PageHeader`. (§4, §6)
11. Add mini-receipt to payment confirmation; extend haptics to all confirm/error paths. (§5)

**Phase 3 — Platform polish & inclusivity**
12. Android: FAB, ripple, drop tab-bar border, tonal elevation, edge-to-edge insets, snackbars. (§6, §7)
13. iOS: large titles, sheet detents, Dynamic Type. (§7, §8)
14. Convert icons PNG→SVG; consolidate fonts. (§2.4–2.5)
15. Dark mode (semantic tokens). (§2.3)
16. Accessibility pass. (§8)

**Home-run shortlist (if you only do 5 things):**
`Pressable + haptics primitive` · `token/type system` · `skeletons over spinners` · `booking-flow inline validation + step indicator` · `consolidate sheets on @gorhom`.
