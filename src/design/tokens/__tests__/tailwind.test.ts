// src/design/tokens/__tests__/tailwind.test.ts
const colors = require('../tailwind');

test('tailwind color map derives from tokens', () => {
  expect(colors.canvas).toBe('#FAF6EE');
  expect(colors.ink.muted).toBe('#7A7060');
  expect(colors.line.DEFAULT).toBe('#E7DEC9');
  expect(colors.accent.on).toBe('#211C15');
});
