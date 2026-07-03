# Aashray — Per-Page & Per-Component Redesign Plan

**Scope:** every screen and component reviewed (44 pages + 85 components), re-validated against `main` @ `087d916`. No new UI files vs the earlier `feat` review — the only addition is a non-UI helper `src/utils/bookingHistoryFilter.ts` (active/past split with a grace period; the `BookingCancellationList` engine in §5 should reuse it). All correctness bugs in §0.1 were re-confirmed present on `main`. **Companions:** [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (the "Sanctuary" system + component contracts), [`UI_UX_AUDIT.md`](./UI_UX_AUDIT.md) (cross-cutting gaps).

**Verdict scale:** **KEEP** = fine, just retoken to Sanctuary · **REFINE** = structure is sound, upgrade hierarchy/states/motion/copy + move onto system components · **REDESIGN** = rework the UX/layout itself for peak UX.

---

## 0. Executive summary

- **The dominant problem isn't per-screen ugliness — it's duplication.** The app is largely the *same flows built 3× and the same cards built 16×*. That duplication is the root cause of most UX drift and has already produced real bugs. Consolidating into **config-driven engines** (§5) is the single highest-leverage move: it fixes UX and maintainability at once, and every future fix then happens once instead of up to sixteen times.
- **Verdict tally:** ~**28 REDESIGN**, ~**34 REFINE**, ~**17 KEEP** (grouped families counted per file in §4).
- **Genuinely good, keep the concept:** `sign-in`, `SteppedFeedback`, adhyayan/utsav detail *shells*, `menu`, `contactInfo`, `OldBookingsTrigger` (progressive disclosure), `FoodBookingCancellation` multi-select, the `ChargeBreakdownBottomSheet`/`BottomSheetFilter` gorhom sheets. These become the templates.

### 0.1 Correctness / safety bugs found (fix regardless of redesign timing)
These are not polish — they are defects surfaced during the review:

1. **`FoodBookingCancellation.tsx`** — bulk "Cancel (N) Bookings" fires **with no confirmation dialog**. Destructive, irreversible, and inconsistent with every other cancel flow. *(safety)*
2. **`booking addons/AdhyayanAddon.tsx`** — the register button uses a literal placeholder string `'#your-secondary-color'` as its actual border/background color. *(broken styling)*
3. **`utsav/dailySchedule.tsx`** — shows a **hardcoded placeholder schedule** (generic 6am–9pm), not the real event's times. Real users see fake data. *(functional)*
4. **`adhyayan/[id].tsx`** — the "Daily schedule" and "Adhyayan guidelines" rows render a chevron but have **no `onPress`** — dead taps. (utsav's equivalents work.) *(functional)*
5. **`guestBooking/bookingReview.tsx` & `mumukshuBooking/bookingReview.tsx`** — a copy-paste **dead ternary**: both branches are identical (`pregular`/`pregular`, same hex), so the intended "credit applied" emphasis never renders. *(logic)*
6. **`utsav/[id].tsx`** — guest branch calls `updateGuestBooking('utsav', …)` **twice** in a row. *(redundant write)*
7. **`profile/transactions.tsx`** — `selectedChip` filter state is sent to the API but **no filter UI is rendered** — users can't change it. Dead feature. *(functional)*
8. **`OtherUsersForm.tsx`** — dead code (imported nowhere) **and** broken (destructures `isVerifyUserError` but never wires it, so failed lookups show no error). Delete or consolidate. *(dead/broken)*
9. **Debug leaks** — `console.log` of the full guest object in `guestBooking/[booking].tsx`; stray `console.log`s in `RoomBookingDetails.tsx` and `TravelBookingDetails.tsx`; commented-out dead code in `TravelBookingCancellation.tsx`, `OtherMumukshuForm.tsx`.
10. **`questions/utsavFeedback.ts`** — the two open-text questions are **not** marked `optional`, unlike the identical ones in `adhyayanFeedback.ts` — forces every utsav respondent to type free text to finish. Intentional? Otherwise drift.

---

## 1. Complete redesigns (P0) — the peak-UX rebuilds

Concepts below use Sanctuary components (see `DESIGN_SYSTEM.md` §10). Ordered by impact.

**1. Home — `(tabs)/index.tsx`.** A booking app whose home has *no booking entry point and no upcoming-stay status*. Rebuild: warm **hero `Card`** showing greeting + real booking status (upcoming stay details, or an empty state with the screen's single saffron **"Book your stay"** `Button`); demote the 6 utility tiles to an equal-weight `ListRow`/icon row below; move social links to a low-emphasis footer. Layout-matched `Skeleton` on load; aspect-ratio sizing (not fixed px); remove `allowFontScaling={false}`; dawn-gradient/mandala signature on the hero.

**2. Booking flow unification — `booking|guestBooking|mumukshuBooking/[booking].tsx` → ONE flow.** Collapse the three ~80%-duplicated add-on screens into a single `BookingStepScaffold` flow parameterized by *participant mode* (self / guest-list / mumukshu-list). Add a persistent **step indicator**; **inline `Field` validation + scroll-to-first-error** (replace blocking `CustomAlert`); **disable Continue until valid**; layout-matched `Skeleton` during re-validation (kill the spinner-swap layout jump); errors via a **`Dialog` with Retry** (not "Okay → back"); selection/success haptics via `Chip`/`Button`.

**3. Booking review unification — `*/bookingReview.tsx` → ONE review.** One tokenized **charge-line component** driven by a data array (retire the 4× nested room/travel/adhyayan/utsav blocks). Fix the dead ternary (§0.1 #5). `Sheet` for charge drill-down (already right in guest/mumukshu — make it shared), `Dialog` for Pay-Later confirm, sticky footer `Button` with live total, consistent success/error haptics.

**4. Confirmation screens — merge `bookingConfirmation` + `paymentConfirmation` → one `ConfirmationScaffold`.** They are near byte-identical duplicates. One component with `status`/`receipt` props: **mini-receipt** (amount, booking id, dates), success/error **haptic fired by the scaffold**, dawn-gradient/mandala, primary "View booking" + tertiary "Home". Rebuild `paymentFailed` on the same scaffold (`status="failure"`, keep its good retry/support content).

**5. Onboarding — `imageCapture.tsx` + `completeProfile.tsx`.** Both hand-duplicate an ad-hoc progress bar and have an unsafe logout (no confirm, no label, sub-target). Rebuild on a shared **step scaffold** with a persistent progress header; imageCapture gets a large circular **photo preview + retake**, upload shown via the `Button` loading state (not a custom % bar), failures via `EmptyState` + retry; completeProfile uses `FormScaffold` with sectioned `Field`s + sticky Continue + inline errors; logout becomes a small guarded secondary action.

**6. `pendingPayments.tsx`.** Densest cards in the app; timer badge absolutely-positioned so it clips the corner. Rebuild each as a `ListRow` (icon, title, amount, status `Tag`, date) with **progressive disclosure** for the rest; timer inline beside the status tag; `Dialog` for the international-payment warning; `Skeleton` list on load; sticky footer `Button` with live total.

**7. `(tabs)/profile.tsx`.** Highest-traffic screen; hand-rolled password-reset `Modal`+`Animated` **and** a `CustomModal` credits dialog (two modal systems on one screen); dev-backend toggles sit in the normal settings list. Rebuild on `ScreenScaffold`+`Header`; password reset → `Sheet`; credits info → `Dialog`; settings → `ListRow`s in a `Card`; **move dev toggles to a hidden dev route**; avatar via `aspectRatio`; labelled edit `Touchable`.

**8. `(home)/wifi.tsx`.** The long raw-`Modal` info screen (4 bullets + "Setup Guides" + 2 stacked accordions × 4 rows × 2 buttons). Rebuild the info as a `Sheet` (large detent): keep the 4 rules always visible; move tutorials into a **`Segmented`** (Mumukshus / Residents) so only one set shows — halves the scroll; tutorial links become `ListRow`s.

**9. `utsav/[id].tsx` registration.** Currently a **`CustomSelectBottomSheet` nested inside a centered `Modal`** (sheet-in-dialog — ambiguous dismiss/back), cramming package + arrival + conditional car-no + volunteer + notes into an 80%-height scroll. Rebuild as a stepped `Sheet`/`FormScaffold`: Step 1 who's registering (`Chip`), Step 2 package & logistics (inline-validated `Field`s), hand off to shared review. Fix the double `updateGuestBooking` (§0.1 #6).

**10. `profile/transactions.tsx`.** Add the missing **filter UI** (`Segmented`/`Chip` wired to the existing `selectedChip` state — §0.1 #7); collapse rows to `ListRow` (category icon, title+dates, trailing amount + status `Tag`) with details behind disclosure; `Skeleton` rows on load.

**11. `(home)/maintenanceRequestList.tsx`.** Square pseudo-FAB (wrong on both platforms) → platform-correct FAB (Android circular elevated / iOS header "+"); bare error text → `EmptyState` + retry; 3-field new-request `Modal` → `Sheet`; filter chips → `Chip`; inline validation.

**12. Booking category pickers — `RoomBooking / TravelBooking / FoodBooking / AdhyayanBooking / EventsBooking`.** All REDESIGN: `BookingStepScaffold`, `Segmented`+`Chip`, animated panel swap, `Sheet` pickers, inline validation. `AdhyayanBooking`/`EventsBooking` registration modals → `Sheet` (Events currently uses iOS-only `pageSheet` → inconsistent on Android). **`FoodBooking`** also has a flow inconsistency to fix: guest path fires Razorpay inline with no receipt while other paths route to review — route all through review → `ConfirmationScaffold`.

**13. Addon accordions — `AddonItem.tsx` + 11 addon forms.** Rebuild `AddonItem` as an `AddonCard` pattern on `Card` + `Touchable` (role=switch, labelled, 44/48 target) with **Reanimated height+opacity** expand (fixes the instant-snap across all 11 consumers at once). Then de-duplicate the 11 addon files into **4 field-sets (Room/Food/Travel/Adhyayan) + 1 grouped-list pattern** (see §5). Fix the AdhyayanAddon color bug (§0.1 #2).

**14. Bookings-list cards — 16 files → `BookingDetailCard` engine.** One config-driven card (`Card` + `ListRow` + `Tag`) with per-domain config (icon, title, status mapping, ordered rows); guest/mumukshu = same component, different store slice. Default shows date + status + one key line, rest behind disclosure. Removes 5-icon-library inconsistency, raw red/green pills, and the flat-dump density. Remove stray `console.log`s (§0.1 #9).

**15. Cancellation screens — 5 files → `BookingCancellationList` engine.** One engine (query fn + row config + cancel mutation + optional multi-select mode). Cancel confirm → `Dialog`/`Sheet` **showing the refund rule before confirming**; errors → `EmptyState`; **add the missing confirm to Food bulk-cancel** (§0.1 #1). Built on the redesigned `ExpandableItem`.

**16. `ExpandableItem.tsx` + `CustomExpandableList.tsx`.** `ExpandableItem` underlies all 5 cancel screens → rebuild on `Card`+`Touchable` with animated height+opacity + rotating chevron `Icon`; **retire `CustomExpandableList`** (a second, redundant expand implementation) into it.

**17. Shared library replacements** (see migration map, `DESIGN_SYSTEM.md` §14): `CustomButton`→`Button`, `CustomModal`/`CustomAlert`→`Dialog`, `CustomSelectBottomSheet`/`UpdateModal`→`Sheet`, `CustomChipGroup`/`AnimatedChipGroup`→`Chip`, `Shimmer`→`Skeleton` (real sweep), `CustomEmptyMessage`/`CustomErrorMessage`/`ErrorFallback`→`EmptyState`, `FormField`→`Field`, `PageHeader`→`Header`+`ScreenScaffold`, `CustomHomeIcon`→home tile on `Touchable`+`Icon`.

---

## 2. Refinements (P1) — keep structure, move onto the system

`_layout.tsx` (root: fonts→Fraunces/DM Sans, drop the 200ms splash delay, per-screen SystemBars, theme wiring) · `sign-in` (→ system Button/Field/Dialog; keep the spring layout) · `(tabs)/_layout` (token tints, Android Material tab surface, edge-to-edge insets) · `book-now` / `bookings` (→ `Chip`, shared category `Skeleton`, panel transition) · `menu` / `contactInfo` (retoken off raw StyleSheet — keep interactions) · `support` (inline validation + char counter, `Sheet` picker, `Dialog` discard) · `TemporaryWifiSection` (tokens, `Icon`, tap-code-to-copy) · `profileDetails` (`FormScaffold` + pinned `Header`) · `adhyayan/[id]` shell (retoken, drop blue share accent, fix dead taps, register→`Sheet`) · `utsavGuidelines` (`ScreenScaffold`, neutral bullet) · `adhyayan/feedback` + `utsav/feedback` (`EmptyState` CTA on access-denied, `Dialog` exit) · `SteppedFeedback/*` (haptics, a11y roles/labels, 44pt targets, TextInput serif→sans, SuccessScreen success-haptic + dawn gradient) · `ProfileForm` (scroll-to-error, unify the two error mechanisms, `FormScaffold`) · `GuestForm` / `OtherMumukshuForm` (`Touchable`+`Icon`, "Add more"→`Button variant=tertiary`, off-palette blue→info token, remove dead code) · `paymentFailed` (retoken, add haptic — else rebuild on `ConfirmationScaffold`) · `BookingStatusDisplay` (→ `Tag tone` — high-leverage, on every row) · `Callout` (tokens + `Icon`; dedupe the inline copy in FoodBookingCancellation) · `OldBookingsTrigger` (`Touchable`, animate reveal) · `PrimaryAddonBookingCard` (→ `Card`+`Text variant`) · `FlatBooking` (light retoken + inline validation) · `BottomSheetFilter` / `ChargeBreakdownBottomSheet` (retoken; keep gorhom) · `SegmentedControl` (→ Reanimated spring or fold into `Segmented`) · `CustomTag` (→`Tag`) · `CustomCalender` (heavy retheme to tokens, **fix white-on-saffron contrast → ink-on-saffron**, haptic on select, range summary "3 nights · Fri 4–Mon 7", type the props) · `FormDisplayField` (read-only `Field`/`ListRow`) · `QrModal` (retoken, a11y; keep blur) · `TabBarBackground(.tsx/.ios)` (Android translucent surface; retoken) · `adhyayan/_layout` (align modal presentation with utsav) · `questions/utsavFeedback` (resolve optional inconsistency).

---

## 3. Keep (P2) — retoken only / no structural change

`(auth)/_layout` (clean dead routes) · `(home)/_layout` · `profile/_layout` · `booking|guestBooking|mumukshuBooking/_layout` · `(payment)/_layout` · `utsav/_layout` (the correct template) · `(tabs)/qrModal` (intentional stub) · `+not-found` (retoken shared fallback) · `SteppedFeedback/SteppedFeedbackShimmer` (exemplary skeleton) · `questions/adhyayanFeedback` (data) · `HapticTab` · `ShadowBox` (becomes the elevation source — ensure everything routes through it) · `HorizontalSeparator` (token border).

---

## 4. Full coverage table (every file)

Near-identical families are grouped in one row but every path is named, so coverage is complete.

### Pages (44)
| Path(s) | Purpose | Verdict |
|---|---|---|
| `app/_layout.tsx` | App shell: fonts, splash, providers, protected stack | REFINE |
| `(auth)/_layout.tsx` | Auth stack (fade) | KEEP |
| `(auth)/sign-in.tsx` | Phone+password sign-in, forgot-password | REFINE |
| `(onboarding)/completeProfile.tsx` | Onboarding: profile form gate | **REDESIGN** |
| `(onboarding)/imageCapture.tsx` | Onboarding: profile photo capture | **REDESIGN** |
| `(tabs)/_layout.tsx` | Bottom tab bar | REFINE |
| `(tabs)/index.tsx` | Home dashboard | **REDESIGN** |
| `(tabs)/book-now.tsx` | Booking-type picker tab | REFINE |
| `(tabs)/bookings.tsx` | My-bookings picker tab | REFINE |
| `(tabs)/qrModal.tsx` | QR tab stub (no-op) | KEEP |
| `+not-found.tsx` | 404 fallback | KEEP |
| `(home)/_layout.tsx` | Home utilities stack | KEEP |
| `(tabs)/profile.tsx` | Profile: avatar, credits, settings | **REDESIGN** |
| `profile/_layout.tsx` | Profile sub-stack | KEEP |
| `profile/profileDetails.tsx` | Edit profile | REFINE |
| `profile/qr.tsx` | Full-screen check-in QR | **REDESIGN** |
| `profile/transactions.tsx` | Transaction history | **REDESIGN** |
| `(home)/menu.tsx` | Meal menu by day | REFINE |
| `(home)/wifi.tsx` | WiFi codes + info modal | **REDESIGN** |
| `(home)/support.tsx` | Support ticket | REFINE |
| `(home)/contactInfo.tsx` | Department/staff directory | REFINE |
| `(home)/maintenanceRequestList.tsx` | Maintenance requests + new | **REDESIGN** |
| `(home)/pendingPayments.tsx` | Pending payments + pay | **REDESIGN** |
| `booking/_layout` · `guestBooking/_layout` · `mumukshuBooking/_layout` | Booking flow stacks | KEEP |
| `booking/[booking]` · `guestBooking/[booking]` · `mumukshuBooking/[booking]` | Add-ons step (3 duplicates) | **REDESIGN → unify** |
| `booking/bookingReview` · `guestBooking/bookingReview` · `mumukshuBooking/bookingReview` | Review+pay (3 duplicates) | **REDESIGN → unify** |
| `(payment)/_layout.tsx` | Payment stack | KEEP |
| `(payment)/bookingConfirmation` · `(payment)/paymentConfirmation` | Success screens (duplicates) | **REDESIGN → merge** |
| `(payment)/paymentFailed.tsx` | Failure screen | REFINE |
| `adhyayan/[id].tsx` | Adhyayan detail + register | REFINE (register→Sheet) |
| `adhyayan/_layout.tsx` | Adhyayan stack | REFINE |
| `adhyayan/feedback/[id].tsx` | Adhyayan feedback gate | REFINE |
| `utsav/[id].tsx` | Utsav detail + register | **REDESIGN** |
| `utsav/_layout.tsx` | Utsav stack (template) | KEEP |
| `utsav/dailySchedule.tsx` | Daily schedule (fake data bug) | **REDESIGN** |
| `utsav/utsavGuidelines.tsx` | Guidelines list | REFINE |
| `utsav/feedback/[id].tsx` | Utsav feedback gate | REFINE |

### Components (85)
| Path(s) | Purpose | Verdict |
|---|---|---|
| `booking/RoomBooking · TravelBooking · FoodBooking · AdhyayanBooking · EventsBooking` | Category pickers | **REDESIGN** |
| `booking/FlatBooking.tsx` | Simplest picker | REFINE |
| `AddonItem.tsx` | Accordion primitive (used by 11) | **REDESIGN** |
| `booking addons/RoomAddon · FoodAddon · TravelAddon · AdhyayanAddon` | Self addon forms | **REDESIGN** (Adhyayan: color bug) |
| `booking addons/GuestRoomAddon · GuestFoodAddon · GuestAdhyayanAddon` | Guest addon forms | **REDESIGN → dedup** |
| `booking addons/MumukshuRoomAddon · MumukshuFoodAddon · MumukshuTravelAddon · MumukshuAdhyayanAddon` | Mumukshu addon forms | **REDESIGN → dedup** |
| `PrimaryAddonBookingCard.tsx` | Titled card wrapper | REFINE |
| `booking details cards/` Room·Guest Room·Mumukshu Room · Travel·Mumukshu Travel · Food·Guest Food·Mumukshu Food · Adhyayan·Guest Adhyayan·Mumukshu Adhyayan · Event·Guest Event·Mumukshu Event · Guest Flat·Mumukshu Flat (16) | Read-only booking summary cards | **REDESIGN → 1 engine** |
| `cancel booking/RoomBookingCancellation · TravelBookingCancellation · AdhyayanBookingCancellation · EventBookingCancellation` | Single-cancel lists | **REDESIGN → 1 engine** |
| `cancel booking/FoodBookingCancellation.tsx` | Bulk-cancel (no-confirm bug) | **REDESIGN** |
| `BookingStatusDisplay.tsx` | Status pills | REFINE (→Tag) |
| `OldBookingsTrigger.tsx` | Past-bookings disclosure | REFINE |
| `ExpandableItem.tsx` | Expandable row (used by 5) | **REDESIGN** |
| `CustomExpandableList.tsx` | Duplicate expandable list | **REDESIGN → retire** |
| `Callout.tsx` | Inline banner | REFINE |
| `SteppedFeedback/index.tsx` | Feedback orchestrator | REFINE |
| `SteppedFeedback/ProgressBar · RatingInput · BooleanInput · TextInput · SuccessScreen` | Feedback pieces | REFINE |
| `SteppedFeedback/SteppedFeedbackShimmer.tsx` | Feedback skeleton | KEEP |
| `GuestForm.tsx` | Guest add w/ lookup | REFINE |
| `ProfileForm.tsx` | Full profile form | REFINE |
| `OtherMumukshuForm.tsx` | Mumukshu add w/ lookup | REFINE |
| `OtherUsersForm.tsx` | Dead + broken duplicate | **REDESIGN → delete** |
| `questions/adhyayanFeedback.ts` | Feedback data | KEEP |
| `questions/utsavFeedback.ts` | Feedback data (optional bug) | REFINE |
| `CustomButton.tsx` | Buttons | **REDESIGN →Button** |
| `CustomModal · CustomAlert` | Centered modals | **REDESIGN →Dialog** |
| `UpdateModal.tsx` | Force-update sheet | **REDESIGN →Sheet** |
| `CustomSelectBottomSheet.tsx` | Hand-rolled select sheet | **REDESIGN →Sheet** |
| `BottomSheetFilter.tsx` | Filter sheet (gorhom) | REFINE |
| `ChargeBreakdownBottomSheet.tsx` | Charge sheet (gorhom) | REFINE |
| `CustomChipGroup · AnimatedChipGroup` | Chips | **REDESIGN →Chip** |
| `SegmentedControl.tsx` | Segmented (JS-thread) | REFINE (→Segmented) |
| `CustomTag.tsx` | Tag | REFINE (→Tag) |
| `CustomCalender.tsx` | Date/range picker | REFINE (heavy retheme) |
| `Shimmer.tsx` | Pulse skeleton | **REDESIGN →Skeleton** |
| `CustomEmptyMessage · CustomErrorMessage · ErrorFallback` | Empty/error UIs | **REDESIGN →EmptyState** |
| `ErrorText.tsx` | Inline error text | KEEP (absorb into Field) |
| `FormField.tsx` | Text input | **REDESIGN →Field** |
| `FormDisplayField.tsx` | Read-only field | REFINE |
| `ShadowBox.tsx` | Elevation tokens | KEEP (elevation source) |
| `HorizontalSeparator.tsx` | Divider | KEEP |
| `CustomHomeIcon.tsx` | Home quick tile | **REDESIGN** |
| `HapticTab.tsx` | Tab haptic | KEEP |
| `TabBarBackground.tsx` | Android tab bg (no-op) | REFINE |
| `TabBarBackground.ios.tsx` | iOS blur tab bg | REFINE |
| `QrModal.tsx` | QR bottom sheet | REFINE |
| `PageHeader.tsx` | Screen header | **REDESIGN →Header** |

---

## 5. Consolidation blueprint (the structural redesign)

Six config-driven pieces replace the bulk of the duplicated code:

| New (in `src/design/patterns` or feature dir) | Replaces | Files: before → after |
|---|---|---|
| `UnifiedBookingFlow` (participant mode) | 3× `[booking].tsx` add-on screens | 3 → 1 |
| `BookingReview` (shared charge-lines) | 3× `bookingReview.tsx` | 3 → 1 |
| `ConfirmationScaffold` | `bookingConfirmation` + `paymentConfirmation` (+ `paymentFailed`) | 2–3 → 1 |
| `AddonCard` + 4 field-sets + grouped-list | `AddonItem` + 11 addon files | 12 → ~6 |
| `BookingDetailCard` (per-domain config) | 16 details cards | 16 → 1 |
| `BookingCancellationList` (+ multi-select mode) | 5 cancellation screens | 5 → 1 |

Net: **~41 near-duplicated files → ~11**, and every UX/token/a11y fix afterwards is made once. This is where "peak UX" and "maintainable" become the same project.

---

## 6. Sequenced execution

Aligns with `DESIGN_SYSTEM.md` §14 phases:

- **Phase 0 (foundation):** ship tokens + primitives + core components (`Button/Field/Text/Touchable/Icon/Card/Tag/Skeleton/EmptyState/Dialog/Sheet/Header`) and the scaffolds. Land the **correctness bugs in §0.1 now** — they're independent of the redesign and some are safety issues.
- **Phase 1 (feel):** `Pressable`+haptics everywhere, real `Skeleton`, `ExpandableItem`/`AddonItem` animation (unblocks all addon + cancel screens), stack transitions.
- **Phase 2 (structural redesigns):** build the six §5 engines; then rebuild the P0 screens on them — Home, unified booking flow + review + confirmation, onboarding, pendingPayments, profile, wifi, utsav registration, transactions, maintenance.
- **Phase 3 (platform + inclusivity):** Android FAB/ripple/tab surface/edge-to-edge, iOS large titles/detents/Dynamic Type, PNG→SVG icons, dark mode, full a11y pass, retire all legacy shared components.

**If you rebuild only five things for maximum UX gain:** Home · the unified booking flow (step indicator + inline validation) · `ConfirmationScaffold` with a receipt · `BookingDetailCard` + `BookingCancellationList` engines · `ExpandableItem`/`AddonItem` animation. These touch the highest-traffic, highest-stakes, most-duplicated surfaces at once.
