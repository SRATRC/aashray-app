# Sanctuary Design System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up an in-house, token-driven design system (`src/design`) in the Aashray app and prove it by converting the Sign-in screen to it — the foundation every later UI phase builds on.

**Architecture:** Layered — Tokens → Primitives → Components → Patterns → Screens (see `DESIGN_SYSTEM.md` §2). Tokens are the single source of truth; `tailwind.config.js` derives its colors from the same token module, so NativeWind classes and the `useTheme()` JS API resolve to identical values. Dark mode is structured-for now, fully wired in Phase 3.

**Tech Stack:** Expo SDK 56, RN 0.85, React 19, expo-router, NativeWind v4, Reanimated 4, expo-haptics, expo-font, react-native-svg + lucide-react-native (new), jest-expo + @testing-library/react-native (new).

## Global Constraints

Every task implicitly includes these (from `DESIGN_SYSTEM.md` §3 and project memory):
- **No raw hex/rgba** outside `src/design/tokens/palette.js`. Use a token.
- **No raw `fontSize`/`fontFamily`/`fontWeight`** — use `<Text variant=…>`.
- **No `TouchableOpacity`** in new code — use `<Touchable>`.
- **No `Dimensions.get()` at module scope**; no hardcoded layout px.
- **No `allowFontScaling={false}`**; cap controls at `maxFontSizeMultiplier` 1.4.
- **No `useNativeDriver:false` Animated** for new work — use Reanimated.
- Min touch target 44pt iOS / 48dp Android; `accessibilityRole` + `accessibilityLabel` on interactive elements.
- **Never toggle `display: none↔flex`** on a mounted Fabric subtree (SIGABRTs on SDK 56) — conditionally mount instead.
- **Never** wrap the root navigator in `StrictMode` (double-mounts, breaks expo-router splash).
- `@gorhom/bottom-sheet` must stay **>= 5.2.14**; `react-native-razorpay` **>= 3.0.0**.
- Any token/component change updates `DESIGN_SYSTEM.md` §10 + the Gallery in the **same PR**.
- Poppins is **not removed** in Phase 0 (screens still use `font-p*`); its removal is a Phase 3 cleanup once migration completes.

---

## File Structure (Phase 0)

```
src/design/
  tokens/
    palette.js        # CJS. Raw hex ramps. PRIVATE — never imported by screens.
    semantic.js       # CJS. Structured light/dark semantic tokens (source of truth).
    tailwind.js       # CJS. Flattens semantic.light -> tailwind color map.
    scale.ts          # spacing, radius, elevation, motion, zIndex tokens (TS).
    typography.ts     # Text variant table -> {family,size,lineHeight,weight,tracking}.
    index.ts          # public TS barrel (re-exports semantic + scale + typography).
  theme/
    ThemeProvider.tsx # resolves colorScheme -> active semantic tokens; provides context.
    useTheme.ts       # hook: const t = useTheme(); t.color.text.primary
  primitives/
    Text.tsx          # variant-driven text.
    Touchable.tsx     # Pressable wrapper: press-scale + ripple + haptic + a11y + min target.
    Icon.tsx          # lucide/svg icon by name.
    index.ts
  components/
    Button.tsx        # variants/sizes/states.
    Field.tsx         # labelled text input with focus/error/secure states.
    index.ts
  icons/
    registry.ts       # name -> lucide component map (+ custom domain icons later).
  gallery/
    Gallery.tsx       # dev-only catalog rendering every token/primitive/component/state.
  index.ts            # public barrel: `import { Button, Text, useTheme } from '@/src/design'`

# Modified:
tailwind.config.js                    # colors derived from tokens/tailwind.js
src/app/_layout.tsx                   # add fonts; wrap tree in <ThemeProvider>
src/app/(auth)/sign-in.tsx            # migrate to Text/Button/Field/tokens (proof)
src/app/(tabs)/_dev-gallery.tsx       # dev route mounting <Gallery/> (guarded by __DEV__)
package.json                          # test deps + jest config + eslint rules
.eslintrc.js (new, replaces inline)   # add no-hex + no-TouchableOpacity rules
src/assets/fonts/Fraunces-SemiBold.ttf, DMSans-SemiBold.ttf   # new font files
```

---

## Task 0: Test + lint toolchain

**Files:**
- Modify: `package.json` (devDeps, scripts, jest config)
- Create: `.eslintrc.js` (moves inline `eslintConfig` here + adds rules)
- Create: `jest.setup.js`
- Create: `src/design/__tests__/smoke.test.tsx`

**Interfaces:**
- Produces: `npm test` (jest-expo + RNTL), `npm run lint` enforcing no-hex + no-TouchableOpacity.

- [ ] **Step 1: Install test + svg deps**

```bash
npx expo install jest-expo react-native-svg lucide-react-native
npm i -D jest @testing-library/react-native @types/jest eslint-plugin-local-rules
```

- [ ] **Step 2: Add jest config + scripts to package.json**

```jsonc
// package.json — add:
"scripts": { "test": "jest", "test:watch": "jest --watch" },
"jest": {
  "preset": "jest-expo",
  "setupFilesAfterEnv": ["@testing-library/react-native/extend-expect", "<rootDir>/jest.setup.js"],
  "transformIgnorePatterns": [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|nativewind|react-native-svg|lucide-react-native|@gorhom/.*|react-native-reanimated))"
  ]
}
```

- [ ] **Step 3: jest.setup.js — mock native modules used by primitives**

```js
// jest.setup.js
require('react-native-reanimated').setUpTests?.();
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(), notificationAsync: jest.fn(), selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 's', Error: 'e' },
}));
```

- [ ] **Step 4: Move eslint to .eslintrc.js and add design-system rules**

```js
// .eslintrc.js
module.exports = {
  root: true,
  extends: ['universe/native'],
  rules: {
    'no-restricted-imports': ['error', { paths: [
      { name: 'react-native', importNames: ['TouchableOpacity', 'TouchableHighlight'],
        message: 'Use <Touchable> from @/src/design instead.' }] }],
    'no-restricted-syntax': ['error',
      { selector: "Literal[value=/^#(?:[0-9a-fA-F]{3,4}){1,2}$/]",
        message: 'No raw hex. Use a token from @/src/design/tokens.' }],
  },
  overrides: [ // tokens + tests may contain raw hex
    { files: ['src/design/tokens/**', '**/*.test.*', '**/__tests__/**'],
      rules: { 'no-restricted-syntax': 'off' } }],
};
```
Then delete the `eslintConfig` key from `package.json`.

- [ ] **Step 5: Smoke test**

```tsx
// src/design/__tests__/smoke.test.tsx
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
test('jest-expo renders', () => {
  const { getByText } = render(<Text>ok</Text>);
  expect(getByText('ok')).toBeTruthy();
});
```

- [ ] **Step 6: Run & verify**

Run: `npm test -- src/design/__tests__/smoke.test.tsx`
Expected: 1 passing. Run `npm run lint` — expected: passes (no violations yet).

- [ ] **Step 7: Commit**

```bash
git add package.json .eslintrc.js jest.setup.js src/design/__tests__/smoke.test.tsx
git commit -m "chore: add jest-expo + RNTL test toolchain and design-system lint rules"
```

---

## Task 1: Token layer (palette, semantic, scale, typography)

**Files:**
- Create: `src/design/tokens/palette.js`, `semantic.js`, `tailwind.js`, `scale.ts`, `typography.ts`, `index.ts`
- Test: `src/design/tokens/__tests__/tokens.test.ts`

**Interfaces:**
- Produces (CJS): `palette` object; `semantic = { light, dark }` structured as `{ bg:{canvas,surface,surfaceRaised,sunken,tint}, text:{primary,secondary,muted,disabled,inverse,accent}, line:{subtle,default,strong}, accent:{default,pressed,tint,on}, status:{success,successBg,error,errorBg,warning,warningBg,info,infoBg}, ring }`.
- Produces (TS): `tokens` barrel with `spacing`, `radius`, `elevation`, `motion`, `zIndex`, `typography`.
- Produces: `tailwindColors` (flat map for tailwind).

- [ ] **Step 1: Write the failing test**

```ts
// src/design/tokens/__tests__/tokens.test.ts
import { semantic } from '../semantic';
import { spacing, radius, typography } from '../index';
test('light canvas + accent contrast pairing', () => {
  expect(semantic.light.bg.canvas).toBe('#FAF6EE');
  expect(semantic.light.accent.default).toBe('#E0952A');
  expect(semantic.light.accent.on).toBe('#211C15'); // dark ink on saffron, per spec contrast rule
});
test('scale + typography tokens exist', () => {
  expect(spacing[4]).toBe(16);
  expect(radius.md).toBe(12);
  expect(typography.title.family).toBe('Fraunces-SemiBold');
  expect(typography.body.size).toBe(15);
});
```

- [ ] **Step 2: Run to verify it fails** — `npm test -- tokens.test` → FAIL (cannot find `../semantic`).

- [ ] **Step 3: Implement `palette.js`** (raw ramps from `DESIGN_SYSTEM.md` §4.1)

```js
// src/design/tokens/palette.js  — PRIVATE
module.exports = {
  paper: { 50:'#FCFAF4', 100:'#FAF6EE', 200:'#F4EEE0' },
  sand:  { 100:'#EFE7D6', 200:'#E7DEC9', 300:'#D9CDB2' },
  ink:   { 900:'#211C15', 700:'#4A4235', 500:'#7A7060', 300:'#A99E8B' },
  saffron:{ 50:'#FBEFD9', 100:'#F6DCA9', 500:'#E0952A', 600:'#C57E1E', 700:'#A66614' },
  clay:  { 50:'#F7E7E0', 500:'#B45B3E', 600:'#9A4A30' },
  sage:  { 50:'#E9EEE3', 500:'#6E8063', 600:'#566A4C' },
  brick: { 50:'#F6E3E0', 500:'#B23A2E' },
  honey: { 50:'#FAEBCD', 500:'#B8801C' },
  slate: { 50:'#E7EDF1', 500:'#5B7286' },
};
```

- [ ] **Step 4: Implement `semantic.js`** (structured; values from `DESIGN_SYSTEM.md` §4.2)

```js
// src/design/tokens/semantic.js
const p = require('./palette');
const light = {
  bg:   { canvas:p.paper[100], surface:'#FFFDF8', surfaceRaised:'#FFFFFF', sunken:p.paper[200], tint:p.saffron[50] },
  text: { primary:p.ink[900], secondary:p.ink[700], muted:p.ink[500], disabled:p.ink[300], inverse:p.paper[50], accent:p.saffron[700] },
  line: { subtle:p.sand[100], default:p.sand[200], strong:p.sand[300] },
  accent:{ default:p.saffron[500], pressed:p.saffron[600], tint:p.saffron[50], on:p.ink[900] },
  status:{ success:p.sage[600], successBg:p.sage[50], error:p.brick[500], errorBg:p.brick[50],
           warning:p.honey[500], warningBg:p.honey[50], info:p.slate[500], infoBg:p.slate[50] },
  ring: p.saffron[600],
};
// Provisional dark (Phase 3 verifies contrast). Same shape.
const dark = {
  bg:   { canvas:'#16130D', surface:'#1E1A12', surfaceRaised:'#241F16', sunken:'#100E09', tint:'#2A2212' },
  text: { primary:'#F3ECDD', secondary:'#C8BFAC', muted:'#9A9079', disabled:'#6A6250', inverse:'#16130D', accent:'#E8A63E' },
  line: { subtle:'#2A2318', default:'#332C20', strong:'#463C2C' },
  accent:{ default:'#E8A63E', pressed:'#C57E1E', tint:'#2A2212', on:'#16130D' },
  status:{ success:'#8FA383', successBg:'#20271A', error:'#E0705F', errorBg:'#2A1613',
           warning:'#D9A83E', warningBg:'#2A2012', info:'#8AA3B5', infoBg:'#141B20' },
  ring:'#E8A63E',
};
module.exports = { semantic: { light, dark }, light, dark };
```

- [ ] **Step 5: Implement `tailwind.js`** (flatten light → NativeWind color names; avoids `border-border` by using `line`)

```js
// src/design/tokens/tailwind.js
const { light } = require('./semantic');
module.exports = {
  canvas: light.bg.canvas, surface: light.bg.surface, 'surface-raised': light.bg.surfaceRaised,
  sunken: light.bg.sunken, tint: light.bg.tint,
  ink: { DEFAULT: light.text.primary, secondary: light.text.secondary, muted: light.text.muted,
         disabled: light.text.disabled, inverse: light.text.inverse },
  accent: { DEFAULT: light.accent.default, pressed: light.accent.pressed, tint: light.accent.tint,
            on: light.accent.on, text: light.text.accent },
  line: { subtle: light.line.subtle, DEFAULT: light.line.default, strong: light.line.strong },
  success: light.status.success, 'success-bg': light.status.successBg,
  error: light.status.error, 'error-bg': light.status.errorBg,
  warning: light.status.warning, 'warning-bg': light.status.warningBg,
  info: light.status.info, 'info-bg': light.status.infoBg,
  ring: light.ring,
};
// Usage: bg-canvas, text-ink, text-ink-muted, border-line, border-line-strong,
//        bg-accent, text-accent-on, text-accent-text.
```

- [ ] **Step 6: Implement `scale.ts`** (from `DESIGN_SYSTEM.md` §4.3–4.7)

```ts
// src/design/tokens/scale.ts
export const spacing = {0:0,1:4,2:8,3:12,4:16,5:20,6:24,7:32,8:40,9:48,10:64} as const;
export const radius = { sm:8, md:12, lg:16, xl:24, pill:999 } as const;
export const zIndex = { base:0, raised:10, sticky:20, header:30, scrim:40, sheet:50, modal:60, toast:70, tooltip:80 } as const;
export const motion = {
  duration:{ fast:150, base:220, slow:300, deliberate:420 },
  spring:{ gentle:{damping:18,stiffness:180,mass:1}, snappy:{damping:20,stiffness:260,mass:1} },
  press:{ scale:0.98, opacity:0.92 },
} as const;
// Warm ink-tinted elevation. iOS shadow + Android elevation.
export const elevation = {
  e0: {},
  e1: { shadowColor:'#211C15', shadowOpacity:0.06, shadowRadius:12, shadowOffset:{width:0,height:4}, elevation:2 },
  e2: { shadowColor:'#211C15', shadowOpacity:0.10, shadowRadius:20, shadowOffset:{width:0,height:8}, elevation:6 },
  e3: { shadowColor:'#211C15', shadowOpacity:0.14, shadowRadius:28, shadowOffset:{width:0,height:12}, elevation:12 },
} as const;
```
(`elevation` is the one sanctioned place a palette hex string appears in TS, for the shadow color — it is exempted via the eslint `src/design/tokens/**` override.)

- [ ] **Step 7: Implement `typography.ts`** (variant table from `DESIGN_SYSTEM.md` §5)

```ts
// src/design/tokens/typography.ts
export type TextVariant = 'display'|'title'|'headline'|'subtitle'|'body'|'bodyStrong'|'callout'|'caption'|'label'|'button';
export const typography: Record<TextVariant, {family:string; size:number; lineHeight:number; weight?:'400'|'500'|'600'; tracking?:number; transform?:'uppercase'}> = {
  display:  { family:'Fraunces-SemiBold', size:34, lineHeight:40, tracking:-0.5 },
  title:    { family:'Fraunces-SemiBold', size:26, lineHeight:32, tracking:-0.3 },
  headline: { family:'DMSans-SemiBold',   size:20, lineHeight:26, tracking:-0.2 },
  subtitle: { family:'DMSans-Medium',     size:17, lineHeight:24 },
  body:     { family:'DMSans-Regular',    size:15, lineHeight:22 },
  bodyStrong:{family:'DMSans-Medium',     size:15, lineHeight:22 },
  callout:  { family:'DMSans-Regular',    size:16, lineHeight:24 },
  caption:  { family:'DMSans-Regular',    size:13, lineHeight:18 },
  label:    { family:'DMSans-Medium',     size:12, lineHeight:16, tracking:0.6, transform:'uppercase' },
  button:   { family:'DMSans-SemiBold',   size:16, lineHeight:20 },
};
```

- [ ] **Step 8: Implement `index.ts` barrel**

```ts
// src/design/tokens/index.ts
export { semantic, light, dark } from './semantic';
export { spacing, radius, zIndex, motion, elevation } from './scale';
export { typography } from './typography';
export type { TextVariant } from './typography';
```

- [ ] **Step 9: Run tests** — `npm test -- tokens.test` → PASS.

- [ ] **Step 10: Commit** — `git add src/design/tokens && git commit -m "feat(design): add token layer (palette, semantic, scale, typography)"`

---

## Task 2: Wire Tailwind to tokens

**Files:** Modify `tailwind.config.js`; Test `src/design/tokens/__tests__/tailwind.test.ts`

- [ ] **Step 1: Failing test** — assert the flat map has the expected keys/values.

```ts
// src/design/tokens/__tests__/tailwind.test.ts
const colors = require('../tailwind');
test('tailwind color map derives from tokens', () => {
  expect(colors.canvas).toBe('#FAF6EE');
  expect(colors.ink.muted).toBe('#7A7060');
  expect(colors.line.DEFAULT).toBe('#E7DEC9');
  expect(colors.accent.on).toBe('#211C15');
});
```

- [ ] **Step 2: Run → FAIL** (until config change is in place the test passes on the map alone; run to confirm map correctness).

- [ ] **Step 3: Rewrite `tailwind.config.js`** to consume tokens and drop hardcoded colors

```js
const designColors = require('./src/design/tokens/tailwind');
module.exports = {
  content: ['./src/app/**/*.{js,jsx,ts,tsx}', './src/components/**/*.{js,jsx,ts,tsx}', './src/design/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: { extend: {
    colors: designColors,
    fontFamily: { // keep existing Poppins keys during migration; add new families
      fraunces: ['Fraunces-SemiBold'],
      dmregular: ['DMSans-Regular'], dmmedium: ['DMSans-Medium'], dmsemibold: ['DMSans-SemiBold'],
      // ...existing p* + dm* keys retained until Phase 3 Poppins cleanup
    },
  }},
  plugins: [],
};
```
(Retain the current `p*`/`dm*` fontFamily and legacy color keys **only** as long as screens reference them; do not add new legacy usages.)

- [ ] **Step 4: Verify** — `npm test -- tailwind.test` PASS; `npx tsc --noEmit` clean; app still builds (`npx expo start` boots without config error).

- [ ] **Step 5: Commit** — `git commit -am "feat(design): derive tailwind colors from tokens"`

---

## Task 3: ThemeProvider + useTheme

**Files:** Create `src/design/theme/ThemeProvider.tsx`, `useTheme.ts`; Test `src/design/theme/__tests__/useTheme.test.tsx`

**Interfaces:**
- Produces: `<ThemeProvider>` (context) and `useTheme(): { scheme:'light'|'dark'; color: typeof semantic.light }`.

- [ ] **Step 1: Failing test**

```tsx
// src/design/theme/__tests__/useTheme.test.tsx
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ThemeProvider } from '../ThemeProvider';
import { useTheme } from '../useTheme';
function Probe() { const t = useTheme(); return <Text>{t.color.text.primary}</Text>; }
test('provides light tokens by default', () => {
  const { getByText } = render(<ThemeProvider forceScheme="light"><Probe/></ThemeProvider>);
  expect(getByText('#211C15')).toBeTruthy();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```tsx
// src/design/theme/ThemeProvider.tsx
import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { semantic } from '../tokens';
type Scheme = 'light'|'dark';
export type Theme = { scheme: Scheme; color: typeof semantic.light };
const ThemeCtx = createContext<Theme>({ scheme:'light', color: semantic.light });
export function ThemeProvider({ children, forceScheme }:{children:React.ReactNode; forceScheme?:Scheme}) {
  const sys = useColorScheme();
  // Phase 0: light only in production; forceScheme enables dark in Gallery/tests. Phase 3 flips to `forceScheme ?? sys`.
  const scheme: Scheme = forceScheme ?? 'light';
  return <ThemeCtx.Provider value={{ scheme, color: semantic[scheme] }}>{children}</ThemeCtx.Provider>;
}
export { ThemeCtx };
```
```ts
// src/design/theme/useTheme.ts
import { useContext } from 'react';
import { ThemeCtx } from './ThemeProvider';
export const useTheme = () => useContext(ThemeCtx);
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Mount in app** — in `src/app/_layout.tsx`, wrap the existing tree (inside `GestureHandlerRootView`/`SafeAreaProvider`, outside navigation) with `<ThemeProvider>`. Do **not** add StrictMode.
- [ ] **Step 6: Commit** — `git commit -am "feat(design): add ThemeProvider + useTheme"`

---

## Task 4: Fonts (add Fraunces + DM Sans SemiBold)

**Files:** Add `src/assets/fonts/Fraunces-SemiBold.ttf`, `DMSans-SemiBold.ttf`; Modify `src/app/_layout.tsx`

- [ ] **Step 1:** Download OFL TTFs — Fraunces (opsz~72, SemiBold 600) and DM Sans SemiBold (600) from Google Fonts; place in `src/assets/fonts/`.
- [ ] **Step 2:** Add to the `useFonts({…})` map in `_layout.tsx:141`:
```ts
'Fraunces-SemiBold': require('@/src/assets/fonts/Fraunces-SemiBold.ttf'),
'DMSans-SemiBold': require('@/src/assets/fonts/DMSans-SemiBold.ttf'),
```
- [ ] **Step 3: Verify** — app boots, splash hides after fonts load (existing gating). No test (asset load).
- [ ] **Step 4: Commit** — `git add src/assets/fonts _layout && git commit -m "feat(design): load Fraunces + DM Sans SemiBold fonts"`

---

## Task 5: Text primitive

**Files:** Create `src/design/primitives/Text.tsx`; Test `src/design/primitives/__tests__/Text.test.tsx`

**Interfaces:**
- Produces: `<Text variant color? align? style? maxFontSizeMultiplier? ...RNTextProps>` where `variant: TextVariant`, `color` keyof `theme.color.text` (default `primary`).

- [ ] **Step 1: Failing test**

```tsx
// src/design/primitives/__tests__/Text.test.tsx
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { Text } from '../Text';
test('applies variant family/size and token color', () => {
  const { getByText } = render(<ThemeProvider><Text variant="title">Hi</Text></ThemeProvider>);
  const style = getByText('Hi').props.style;
  const flat = Array.isArray(style) ? Object.assign({}, ...style) : style;
  expect(flat.fontFamily).toBe('Fraunces-SemiBold');
  expect(flat.fontSize).toBe(26);
  expect(flat.color).toBe('#211C15');
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

```tsx
// src/design/primitives/Text.tsx
import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { typography, TextVariant } from '../tokens';
import { useTheme } from '../theme/useTheme';
type Props = TextProps & { variant?: TextVariant; color?: keyof ReturnType<typeof useTheme>['color']['text']; align?: TextStyle['textAlign']; };
export function Text({ variant='body', color='primary', align, style, ...rest }: Props) {
  const t = useTheme(); const v = typography[variant];
  const base: TextStyle = {
    fontFamily: v.family, fontSize: v.size, lineHeight: v.lineHeight,
    letterSpacing: v.tracking, textTransform: v.transform, textAlign: align,
    color: t.color.text[color],
  };
  return <RNText allowFontScaling maxFontSizeMultiplier={1.6} style={[base, style]} {...rest} />;
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat(design): add Text primitive"`

---

## Task 6: Touchable primitive

**Files:** Create `src/design/primitives/Touchable.tsx`; Test `src/design/primitives/__tests__/Touchable.test.tsx`

**Interfaces:**
- Produces: `<Touchable onPress haptic='light'|'selection'|'none'(default 'light') disabled hitSlop accessibilityLabel accessibilityRole='button' style children>` — scale/opacity press (Reanimated) on iOS, `android_ripple` on Android, min 44/48 target, fires haptic on press-in.

- [ ] **Step 1: Failing test**

```tsx
// src/design/primitives/__tests__/Touchable.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { Text } from 'react-native';
import { Touchable } from '../Touchable';
test('fires light haptic and onPress; respects disabled', () => {
  const onPress = jest.fn();
  const { getByText, rerender } = render(<Touchable onPress={onPress} accessibilityLabel="go"><Text>go</Text></Touchable>);
  fireEvent.press(getByText('go'));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(Haptics.impactAsync).toHaveBeenCalled();
  rerender(<Touchable onPress={onPress} disabled accessibilityLabel="go"><Text>go</Text></Touchable>);
  fireEvent.press(getByText('go'));
  expect(onPress).toHaveBeenCalledTimes(1); // no extra call when disabled
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** (Reanimated press scale; ripple on Android; haptic on press-in)

```tsx
// src/design/primitives/Touchable.tsx
import React from 'react';
import { Platform, Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { motion } from '../tokens';
const AP = Animated.createAnimatedComponent(Pressable);
type Props = PressableProps & { haptic?: 'light'|'selection'|'none'; style?: ViewStyle };
const HIT = { top:8, bottom:8, left:8, right:8 };
export function Touchable({ onPress, haptic='light', disabled, style, accessibilityRole='button', hitSlop=HIT, children, ...rest }: Props) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform:[{ scale: s.value }], opacity: disabled ? 0.45 : 1 }));
  const fire = () => { if (haptic==='none'||disabled) return;
    haptic==='selection' ? Haptics.selectionAsync() : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };
  return (
    <AP accessibilityRole={accessibilityRole} disabled={disabled} hitSlop={hitSlop}
        onPressIn={() => { s.value = withTiming(motion.press.scale, {duration:80}); fire(); }}
        onPressOut={() => { s.value = withTiming(1, {duration:120}); }}
        onPress={onPress}
        android_ripple={Platform.OS==='android' && !disabled ? { color:'rgba(33,28,21,0.10)', borderless:false } : undefined}
        style={[{ minHeight: Platform.OS==='ios'?44:48, justifyContent:'center' }, style, anim]}
        {...rest}>
      {children}
    </AP>
  );
}
```
(The single `rgba` here is the platform ripple tint; add to the eslint `src/design/**` allow-list, or promote to a `motion.ripple` token — pick the token route and reference it.)

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat(design): add Touchable primitive (press scale + ripple + haptic)"`

---

## Task 7: Icon primitive

**Files:** Create `src/design/icons/registry.ts`, `src/design/primitives/Icon.tsx`; Test `Icon.test.tsx`

**Interfaces:**
- Produces: `<Icon name size=24 color? strokeWidth=1.5>`; `name` keyof registry. Default color `text.primary`.

- [ ] **Step 1: Failing test** — render `<Icon name="chevron-left"/>` inside ThemeProvider, assert it renders (`toBeTruthy` on test id `icon-chevron-left`).
- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement registry (lucide) + Icon**

```ts
// src/design/icons/registry.ts
import { ChevronLeft, X, Eye, EyeOff, Phone, Copy, Check } from 'lucide-react-native';
export const icons = { 'chevron-left':ChevronLeft, close:X, eye:Eye, 'eye-off':EyeOff, phone:Phone, copy:Copy, check:Check } as const;
export type IconName = keyof typeof icons;
```
```tsx
// src/design/primitives/Icon.tsx
import React from 'react';
import { icons, IconName } from '../icons/registry';
import { useTheme } from '../theme/useTheme';
export function Icon({ name, size=24, color, strokeWidth=1.5 }:{name:IconName; size?:number; color?:string; strokeWidth?:number}) {
  const t = useTheme(); const C = icons[name];
  return <C testID={`icon-${name}`} size={size} color={color ?? t.color.text.primary} strokeWidth={strokeWidth}/>;
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat(design): add Icon primitive + lucide registry"`

---

## Task 8: Button component

**Files:** Create `src/design/components/Button.tsx`; Test `Button.test.tsx`. Contract: `DESIGN_SYSTEM.md` §10.

**Interfaces:**
- Produces: `<Button text variant='primary'|'secondary'|'tertiary'|'destructive'(default primary) size='sm'|'md'|'lg'(default md) fullWidth loading disabled leadingIcon?:IconName trailingIcon?:IconName onPress>` where `text:string` is the label.
- Consumes: `Touchable`, `Text`, `Icon`, tokens.

- [ ] **Step 1: Failing test**

```tsx
// src/design/components/__tests__/Button.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { Button } from '../Button';
const wrap = (ui:any) => render(<ThemeProvider>{ui}</ThemeProvider>);
test('loading hides label + blocks press; disabled blocks press', () => {
  const onPress = jest.fn();
  const { queryByText, getByTestId } = wrap(<Button text="Sign In" loading onPress={onPress}/>);
  expect(queryByText('Sign In')).toBeNull();
  expect(getByTestId('button-spinner')).toBeTruthy();
  fireEvent.press(getByTestId('button-root')); expect(onPress).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** — map variant→{bg,textColor,border} from tokens; `md` height 48 (44 sm / 52 lg); radius `md`; `loading` renders `<ActivityIndicator testID="button-spinner">` in `accent.on`/text color and keeps width; forward `disabled || loading` to `<Touchable testID="button-root">`; label via `<Text variant="button" color=…>`; leading/trailing via `<Icon>`. Full variant/color table lives in `DESIGN_SYSTEM.md` §10 — implement exactly that.

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5:** Add every variant×state to `Gallery` (Task 10 will consume). 
- [ ] **Step 6: Commit** — `git commit -am "feat(design): add Button component"`

---

## Task 9: Field component

**Files:** Create `src/design/components/Field.tsx`; Test `Field.test.tsx`. Contract: `DESIGN_SYSTEM.md` §10.

**Interfaces:**
- Produces: `<Field label value onChangeText placeholder helperText error leadingIcon? secureToggle keyboardType returnKeyType onSubmitEditing autoFocus>`; forwards `ref` to the RN TextInput (for scroll-to-error later).

- [ ] **Step 1: Failing test** — focus state + error rendering + secure toggle:

```tsx
// src/design/components/__tests__/Field.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../../theme/ThemeProvider';
import { Field } from '../Field';
const wrap=(ui:any)=>render(<ThemeProvider>{ui}</ThemeProvider>);
test('shows error text and toggles secure entry', () => {
  const { getByText, getByTestId, getByLabelText } = wrap(
    <Field label="Password" value="x" onChangeText={()=>{}} error="Required" secureToggle placeholder="pw"/>);
  expect(getByText('Required')).toBeTruthy();                 // error helper shown
  const input = getByTestId('field-input');
  expect(input.props.secureTextEntry).toBe(true);             // secure by default when secureToggle
  fireEvent.press(getByLabelText('Show password'));           // eye toggle
  expect(getByTestId('field-input').props.secureTextEntry).toBe(false);
});
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — label `<Text variant="label" color="muted">` on top; container border `line.default` → `accent.default` + `ring` on focus (`onFocus`/`onBlur` state, **not** NativeWind `focus:`) → `status.error` when `error`; helper `<Text variant="caption">` in muted or error; `secureToggle` renders `<Touchable accessibilityLabel={secure?'Show password':'Hide password'}><Icon name={secure?'eye':'eye-off'}/></Touchable>`; iOS `clearButtonMode="while-editing"`; input `testID="field-input"`, `accessibilityLabel={label}`; `maxFontSizeMultiplier={1.4}`.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat(design): add Field component"`

---

## Task 10: Gallery (on-device catalog) + public barrel

**Files:** Create `src/design/gallery/Gallery.tsx`, `src/design/primitives/index.ts`, `src/design/components/index.ts`, `src/design/index.ts`, `src/app/(tabs)/_dev-gallery.tsx`

- [ ] **Step 1:** Write barrels re-exporting tokens, `useTheme`, `ThemeProvider`, `Text`, `Touchable`, `Icon`, `Button`, `Field`.
- [ ] **Step 2:** `Gallery.tsx` — a scroll rendering: color swatches (all semantic tokens), every `Text` variant, `Button` × {variant × state}, `Field` × {default/focus/error/secure}, `Icon` set. Render each block twice — once in `<ThemeProvider forceScheme="light">` and once `forceScheme="dark"` — to preview both.
- [ ] **Step 3:** `_dev-gallery.tsx` — mount `<Gallery/>`; guard so it is only routable when `__DEV__`.
- [ ] **Step 4: Verify** — `npx expo start`, open the gallery route, confirm every component renders in light + dark with correct states.
- [ ] **Step 5: Test** — smoke render of `<Gallery/>` (`npm test`) asserts no throw.
- [ ] **Step 6: Commit** — `git commit -am "feat(design): add Gallery catalog + public barrel"`

---

## Task 11: Prove it — migrate Sign-in to the system

**Files:** Modify `src/app/(auth)/sign-in.tsx`

**Rationale:** Sign-in already uses `FormField` + `CustomButton` + keyboard-controller and is small/high-visibility — the ideal first real screen.

- [ ] **Step 1:** Replace `CustomButton` → `<Button variant="primary" fullWidth text="Sign In" loading={isSubmitting} disabled={!isReady}/>`.
- [ ] **Step 2:** Replace `FormField` (phone, password) → `<Field>` with `keyboardType`, `secureToggle`, `returnKeyType`, `onSubmitEditing`.
- [ ] **Step 3:** Replace raw `Text`/classes with `<Text variant>` and token classes (`bg-canvas`, `text-ink`, etc.). Keep the existing Reanimated keyboard animation (it is already correct).
- [ ] **Step 4: Verify** — `npm run lint` (no raw hex / no TouchableOpacity), `npx tsc --noEmit`, and manual: sign-in renders in Sanctuary look, keyboard behavior unchanged, button shows loading, disabled until valid.
- [ ] **Step 5: Update docs** — tick Phase 0 items in `DESIGN_SYSTEM.md` §14; note Sign-in migrated.
- [ ] **Step 6: Commit** — `git commit -am "feat(design): migrate Sign-in to Sanctuary primitives (Phase 0 proof)"`

---

## Phase 0 — Self-review / acceptance

- Tokens are the only color source; `npm run lint` fails on any raw hex outside `tokens/`.
- `useTheme()` and NativeWind classes resolve to identical values.
- `Text`, `Touchable`, `Icon`, `Button`, `Field` exist with tests for their key states.
- Fonts load; Gallery renders every component in light + dark.
- Sign-in runs on the new system with no regression.
- `DESIGN_SYSTEM.md` and Gallery updated in-PR.

---

## PR Roadmap — Phases 1–3 (detailed plan written when each phase starts)

Each PR below is independently shippable, with the listed acceptance criteria + migration. Full TDD task breakdown is authored at the start of each phase (this plan intentionally details only Phase 0).

**Phase 1 — Motion & feel**
- **PR 1.1 Touchable rollout:** codemod all new/high-traffic `TouchableOpacity` → `<Touchable>`. *Accept:* no `TouchableOpacity` in `src/app` per lint; press feedback + haptic everywhere. *Migrate:* screen-by-screen, keep `onPress`/`hitSlop`.
- **PR 1.2 Skeleton:** real Reanimated shimmer `<Skeleton>` + `SkeletonLine/Box/Circle`; replace `Shimmer` and full-screen spinners on Home, booking add-ons, lists. *Accept:* no bare `ActivityIndicator` for content loads.
- **PR 1.3 Motion on Chip/Segmented/expanders:** Reanimated springs; animate expand/collapse via mount (not `display:none`). *Accept:* 60fps on mid Android; reduce-motion honored.
- **PR 1.4 Stack transitions:** per-platform stack animation + `formSheet` for reviews/confirmations + `fullScreenGestureEnabled` (iOS).

**Phase 2 — Components & flows**
- **PR 2.1 Sheet + Dialog:** build `<Sheet>` (@gorhom) + `<Dialog>`; migrate `CustomSelectBottomSheet`/`UpdateModal`→Sheet, `CustomModal`/`CustomAlert`→Dialog. *Accept:* one sheet architecture; tokenized backdrop; keyboard-safe.
- **PR 2.2 Header + ScreenScaffold:** pinned safe-area header; migrate `PageHeader` + ad-hoc headers. *Accept:* one header system; header stays pinned; per-screen `SystemBars` style.
- **PR 2.3 FormScaffold + booking validation:** inline field errors + scroll-to-first-error + disable-until-valid + retry-on-error. *Accept:* no on-submit-only blocking alerts in booking flow.
- **PR 2.4 BookingStepScaffold:** step progress + reversible + guarded exit across booking/guestBooking/mumukshuBooking.
- **PR 2.5 ConfirmationScaffold:** mini-receipt + success/error haptic + signature gradient on payment/booking confirm.
- **PR 2.6 EmptyState + Toast:** unify empty/error (`CustomEmptyMessage`/`CustomErrorMessage`/`ErrorFallback`); toasts for non-blocking confirmations. *Accept:* every list has empty + error(+retry); confirmations use Toast not modal.

**Phase 3 — Platform & inclusivity**
- **PR 3.1 Android polish:** FAB, ripple audit, drop tab-bar border → tonal elevation, edge-to-edge insets, snackbar placement.
- **PR 3.2 iOS polish:** large titles, sheet detents, Dynamic Type audit.
- **PR 3.3 Icons PNG→SVG:** convert domain icons; retire raster set.
- **PR 3.4 Dark mode:** flip `ThemeProvider` to `forceScheme ?? sys`; verify every token pair for contrast; `dark:` classes where needed.
- **PR 3.5 Poppins removal + a11y sweep:** delete Poppins fonts/keys once no `font-p*` usage remains; full `accessibilityRole`/`Label`/contrast pass.

---

## Changelog
- Plan created 2026-07-03. Details Phase 0; Phases 1–3 as PR roadmap.
