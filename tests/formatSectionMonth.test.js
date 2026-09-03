const assert = require('node:assert/strict');
const test = require('node:test');

const { formatSectionMonth } = require('../src/utils/formatSectionMonth');

test('formats a section month from the first item date', () => {
  assert.equal(formatSectionMonth(9, '2026-09-18'), 'September');
});

test('does not display the year in a section month', () => {
  assert.equal(formatSectionMonth('2026-12', null), 'December');
  assert.equal(formatSectionMonth('September 2026', null), 'September');
});

test('falls back to the original title when it is not a month', () => {
  assert.equal(formatSectionMonth('Upcoming', null), 'Upcoming');
});
