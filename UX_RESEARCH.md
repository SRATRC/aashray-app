# Aashray — UX Research & Principles (2024–2025)

Distilled from current best-practice sources (NN/g, Apple HIG, Material 3, Baymard) and real inspiration apps (Airbnb, Booking.com, Marriott, Monzo/Revolut, Apple Wallet, Calm/Headspace). This is the evidence base for the per-screen redesign in [`REDESIGN_PLAN.md`](./REDESIGN_PLAN.md) and the mockups in `design-preview/`. Companions: [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md).

## The core principle (the "minimal felt worse" fix)
**Minimalism earns attention; density earns confidence and speed.** A booking app is a *do* context (book, rebook, check a stay, pay) → bias toward **organized density**; use whitespace as a hierarchy tool, not a goal.

- **Information scent** is the mechanism: users decide whether to tap a card from visible cues (price, status, dates, image). Strip them → users can't triage → the app *feels* worse even if it looks cleaner (NN/g Information Scent; Flat-Design eyetracking).
- Density isn't the problem — **inconsistent hierarchy is**. A card can carry 5–7 facts and feel clean if organized by a strict type scale + consistent placement (Airbnb photo-first cards; Booking.com field-capped cards; "dense but organized" à la Notion/Linear/Stripe).
- **Split screens by type:** *emotional/hero* (home welcome, onboarding, confirmation) may be airy & image-led; *utility/reference* (bookings, payments, wallet, wifi, menu, schedule, directory, pass) must be **information-dense, fully labeled, flat** — no hiding routine info behind accordions/taps (NN/g progressive disclosure caveats). Sanctuary's warmth lives in color/type/motion, not in withholding content.
- Evidence it's real: Hilton stripped its home → users said it "felt like something's missing"; a minimalist checkout that removed trust signals dropped conversion 1.9%→1.2% (VWO); Snapchat/Gojek redesign backlash from hidden structure; ~60% of users report frustration with over-simplified UIs.

## Per-archetype patterns (do / avoid, with sources)

**Home / dashboard** — Lead with an actionable, **state-aware** upcoming-reservation card (Marriott swaps the home by trip state; Airbnb Trips = living itinerary). Search/book is a **visible tappable module**, not an icon (Booking.com). Personalize from history. Don't ship a thin home. Target dense-but-chunked (NN/g Scrolling & Attention).

**Booking flow** — Multi-step **wizard** once 3+ decision groups; higher completion than one long scroll. Show a **step counter ("3 of 5")** not a % bar. **Range calendar in one view** (start+end highlight, grey unavailable, "today" ≠ "selected") + presets ("This weekend", "±3 days"). Guest/room = **stepper (+/−) in a bottom sheet**. Add-ons get their own step with a **"Continue without extras" skip**. Keep a **persistent price summary across all steps** (Airbnb, Booking.com; NN/g).

**Review & pricing** — Full breakdown (base, taxes, fees, credits) **expanded by default**, not behind "see details" (48% abandon on surprise costs; 14% on hidden totals — Baymard). Price updates **instantly, adjacent** to the changed control. **Sticky bottom bar: running total + one dominant CTA** ("Pay ₹X"). **Keep trust signals** (plain-language cancellation policy, secure-payment badge, reviews) near the CTA (VWO).

**Confirmation / failure** — Success = checkmark + full details + **confirmation number** + **"what happens next"** + save/share (add-to-calendar, receipt) (Baymard; GOV.UK). Failure = **classify the decline** (soft vs hard), **preserve booking state**, single prominent retry CTA (Stripe/Paddle).

**Bookings list + detail** — 2-level progressive disclosure (list→detail). **Status = labeled color chip** (M3). **Status-first tabs, "Upcoming" default** (SpotHero). Card carries image+dates+status+price/id (Booking.com). Detail chunked: dates/room → **live price breakdown** → policies (short text+icons) → actions. **Swipe actions** + **pull-to-refresh** (Apple HIG). Never a blank empty state — status + CTA.

**Forms & validation** — **Validate on blur**, not per keystroke (real-time only for async/password). Error text **below the field**, name the problem, avoid "invalid/illegal" (NN/g). **Match keyboard** to field. **Group into visible sections** (keyboard covers ~40% of screen — Baymard). Conditional fields via progressive disclosure. **OTP autofill** + auto-advance + resend countdown. `KeyboardAwareScrollView` so keyboard never hides input/submit.

**Loading / empty / error** — **Skeletons (not spinners) for loads >500ms** (~300ms faster perceived, bounce −9–20%; NN/g). A blank screen reads as *broken*, not minimal. Empty = instructive + CTA. Error = plain reason + recovery.

**Search / filter** — Persistent search bar + autocomplete + recent searches. Full filters in a **bottom sheet with sticky Apply**; most-used stay on the bar. **Active filters as dismissable chips**. Keep Sort ≠ Filter. Prefer pagination/"Load more" over infinite scroll for comparison lists.

**iOS HIG / Material 3** — **Large titles** on root screens (hide nav border). **Sheet (detents) for scoped tasks, full-screen for multi-step commitment** (checkout). M3 modal sheet (scrim) for filters/pickers. **FAB only for the single most important create action**, max one/screen — don't force one on a home/list with no dominant creation. Per-platform state feedback (Android ripple, iOS opacity/scale + haptics). **Haptics on every commit**; swipe actions; pull-to-refresh.

## Secondary screens
- **Profile = hub**, not just an edit form: surface "My stays", "Wallet" blocks (Airbnb). Group settings into named sections; separate destructive actions at the bottom (Apple Settings).
- **Wallet / credits** — balance with **context**, not a bare number ("≈ 3 nights of stay credit"). **Transaction rows**: category icon + human label + amount + date, tied to the booking; filters + statement (Monzo/Revolut).
- **QR / pass** — boost brightness + lock portrait on open; **fallback text code** below the barcode; key fact (dates) visible when collapsed; **cache offline**; keep QR high-contrast, no overlays (Apple Wallet).
- **Onboarding** — progressive profiling (essentials first), photo optional-now/required-later-for-pass, progress + skip/do-later, oval frame guide + gallery option, contextual (not batched) permissions.
- **Content/reference (menu, schedule, directory, wifi)** — scan-first: section headers, icon+label anchors, tap-to-call/copy as **clear labeled buttons**; keep **flat** (avoid accordions for routinely-needed info).
- **Wide age range (elderly devotees)** — body ≥16pt + Dynamic Type; contrast ≥4.5:1 text / 3:1 UI; targets ≥44pt/48dp; plain language; error-tolerant (confirm destructive, easy undo); never gesture-only (pair with a visible button).
- **Calm/wellness lesson** — Calm/Headspace's weakness is *navigation*, not visuals; keep nav visible; surface ONE smart-default action (Headspace home) while keeping full menus one tap away. "Calm" ≠ "sparse."
