// src/design/tokens/semantic.js
const p = require('./palette');
const light = {
  bg: {
    canvas: p.paper[100],
    surface: '#FFFDF8',
    surfaceRaised: '#FFFFFF',
    sunken: p.paper[200],
    tint: p.saffron[50],
  },
  text: {
    primary: p.ink[900],
    secondary: p.ink[700],
    muted: p.ink[500],
    disabled: p.ink[300],
    inverse: p.paper[50],
    accent: p.saffron[700],
  },
  line: { subtle: p.sand[100], default: p.sand[200], strong: p.sand[300] },
  accent: { default: p.saffron[500], pressed: p.saffron[600], tint: p.saffron[50], on: p.ink[900] },
  status: {
    success: p.sage[600],
    successBg: p.sage[50],
    error: p.brick[500],
    errorBg: p.brick[50],
    warning: p.honey[500],
    warningBg: p.honey[50],
    info: p.slate[500],
    infoBg: p.slate[50],
  },
  ring: p.saffron[600],
};
// Provisional dark (Phase 3 verifies contrast). Same shape.
const dark = {
  bg: {
    canvas: '#16130D',
    surface: '#1E1A12',
    surfaceRaised: '#241F16',
    sunken: '#100E09',
    tint: '#2A2212',
  },
  text: {
    primary: '#F3ECDD',
    secondary: '#C8BFAC',
    muted: '#9A9079',
    disabled: '#6A6250',
    inverse: '#16130D',
    accent: '#E8A63E',
  },
  line: { subtle: '#2A2318', default: '#332C20', strong: '#463C2C' },
  accent: { default: '#E8A63E', pressed: '#C57E1E', tint: '#2A2212', on: '#16130D' },
  status: {
    success: '#8FA383',
    successBg: '#20271A',
    error: '#E0705F',
    errorBg: '#2A1613',
    warning: '#D9A83E',
    warningBg: '#2A2012',
    info: '#8AA3B5',
    infoBg: '#141B20',
  },
  ring: '#E8A63E',
};
module.exports = { semantic: { light, dark }, light, dark };
