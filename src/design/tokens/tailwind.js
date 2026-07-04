// src/design/tokens/tailwind.js
const { light } = require('./semantic');
module.exports = {
  canvas: light.bg.canvas,
  surface: light.bg.surface,
  'surface-raised': light.bg.surfaceRaised,
  sunken: light.bg.sunken,
  tint: light.bg.tint,
  ink: {
    DEFAULT: light.text.primary,
    secondary: light.text.secondary,
    muted: light.text.muted,
    disabled: light.text.disabled,
    inverse: light.text.inverse,
  },
  accent: {
    DEFAULT: light.accent.default,
    pressed: light.accent.pressed,
    tint: light.accent.tint,
    on: light.accent.on,
    text: light.text.accent,
  },
  line: { subtle: light.line.subtle, DEFAULT: light.line.default, strong: light.line.strong },
  success: light.status.success,
  'success-bg': light.status.successBg,
  error: light.status.error,
  'error-bg': light.status.errorBg,
  warning: light.status.warning,
  'warning-bg': light.status.warningBg,
  info: light.status.info,
  'info-bg': light.status.infoBg,
  ring: light.ring,
};
// Usage: bg-canvas, text-ink, text-ink-muted, border-line, border-line-strong,
//        bg-accent, text-accent-on, text-accent-text.
