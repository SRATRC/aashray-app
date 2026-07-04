import { spacing, radius, typography, motion } from '../index';
import { semantic } from '../semantic';

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

test('press motion includes ripple token', () => {
  expect(motion.press.ripple).toBe('rgba(33,28,21,0.10)');
});
