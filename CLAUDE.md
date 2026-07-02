# Aashray — project instructions for AI agents

Aashray is the stay-booking app (Expo SDK 56 / RN 0.85 / expo-router / NativeWind) for a Shrimad Rajchandra / Jain spiritual retreat.

## Before ANY UI work — load the design system

**Read [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) first.** It is the single source of truth for the UI ("Sanctuary" design system) and is written to be machine-actionable — tokens, component contracts, and an "AI Operating Guide" (§13) with decision trees and recipes. Build strictly in-system. The current-state gap analysis is in [`UI_UX_AUDIT.md`](./UI_UX_AUDIT.md).

## Golden rules (full list + rationale in DESIGN_SYSTEM.md §3)

- **Never** hardcode a hex color, font size/family, spacing, or radius. Use a token from `src/design/tokens`; if it's missing, **add a token** — don't inline a value.
- **Never** use `TouchableOpacity`, a hand-rolled bottom sheet, or a raw `Modal` in new code. Use `<Touchable>`, `<Sheet>` (on `@gorhom/bottom-sheet`), `<Dialog>`.
- **Always** use `<Text variant=…>` for text and compose from `src/design` (Tokens → Primitives → Components → Patterns → Screens). Never skip a layer.
- **Always** ship every state (default/pressed/disabled/loading/empty/error), a11y labels + min touch targets, reduce-motion, and light+dark.
- **Always** update `DESIGN_SYSTEM.md` §10 + the `src/design/gallery/` catalog in the same PR as any token/component change. If code and doc disagree, that's a bug.

## Codebase exploration

This project has a knowledge graph — prefer the `code-review-graph` MCP tools (`semantic_search_nodes`, `query_graph`, `get_impact_radius`, `detect_changes`) over Grep/Glob/Read for structural exploration; fall back to file tools only when the graph doesn't cover what you need.
