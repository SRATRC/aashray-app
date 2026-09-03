const assert = require('node:assert/strict');
const test = require('node:test');

const { createPushTokenRegistrar } = require('../src/utils/createPushTokenRegistrar');

test('push registration runs once for concurrent and repeated calls', async () => {
  let calls = 0;
  const registrar = createPushTokenRegistrar(async () => {
    calls += 1;
    return 'ExpoPushToken[test]';
  });

  const first = registrar.ensureRegistered();
  const second = registrar.ensureRegistered();

  assert.equal(await first, 'ExpoPushToken[test]');
  assert.equal(await second, 'ExpoPushToken[test]');
  assert.equal(await registrar.ensureRegistered(), 'ExpoPushToken[test]');
  assert.equal(calls, 1);
});
