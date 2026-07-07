# UI primitives

Owned primitives built on NativeWind. Screens compose these instead of
re-styling from scratch, so UI stays consistent.

## Rules

- Never hard-code a hex color or raw spacing in a component. Use NativeWind
  token classes (`bg-secondary`, `text-gray-500`) or `palette` from `@/theme/tokens`.
- Export every primitive from `index.ts` with an explicit named export (no `export *`).
- One primitive = one file, one responsibility, typed props (no `any`).

## Migrating a `Custom*` component into a primitive

1. Copy it into `src/components/ui/<Name>.tsx`, rename the export.
2. Replace inline hex / `StyleSheet` with token classes or `palette`.
3. Type the props (remove `any`).
4. Add it to `index.ts`.
5. Update call sites during that component's domain Phase 3 pass.

Reference implementations: `Text.tsx`, `Button.tsx`.

> Note: `Button` supersedes the legacy `CustomButton`. It fixes a hard-coded
> `#F97316` spinner color that did not match the `secondary` token (`#F1AC09`).
> `CustomButton` is left in place until call sites migrate during their domain pass.
