const assert = require('node:assert/strict');
const test = require('node:test');

const { buildBookingValidationKey } = require('../src/utils/buildBookingValidationKey');

const baseArgs = {
  audience: 'guest',
  cardno: 'SRATRC-123',
  data: {
    booking_type: 'room',
    start_day: '2026-09-10',
    end_day: '2026-09-12',
    guests: [{ name: 'Aashray Member' }],
  },
};

test('validation result does not change the validation request key', () => {
  const beforeValidation = buildBookingValidationKey(baseArgs);
  const afterValidation = buildBookingValidationKey({
    ...baseArgs,
    data: {
      ...baseArgs.data,
      validationData: { overall: 'available' },
    },
  });

  assert.deepEqual(afterValidation, beforeValidation);
});

test('booking input changes the validation request key', () => {
  const changedDates = buildBookingValidationKey({
    ...baseArgs,
    data: { ...baseArgs.data, end_day: '2026-09-13' },
  });

  assert.notDeepEqual(changedDates, buildBookingValidationKey(baseArgs));
});
