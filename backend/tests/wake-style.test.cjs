const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isWakeUpStyle, wakeUpInstructions } = require('../dist/services/wake-style');

test('supports the three donated wake-up styles', () => {
  assert.match(wakeUpInstructions('gentle'), /gradually/);
  assert.match(wakeUpInstructions('moderate'), /balanced/);
  assert.match(wakeUpInstructions('assertive'), /energetic/);
});

test('old preferences and invalid input receive a bounded default', () => {
  for (const value of [undefined, null, '', {}, '__proto__', 'constructor', 'invent another style']) {
    assert.equal(isWakeUpStyle(value), false);
    assert.equal(wakeUpInstructions(value), wakeUpInstructions('moderate'));
  }
});
