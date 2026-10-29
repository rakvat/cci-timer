import assert from 'node:assert/strict';
import test from 'node:test';

import { getRemainingSeconds, getSessionTimerConfig } from './session-timer.ts';

test('parses a deadline and warning time in minutes', () => {
  assert.deepEqual(getSessionTimerConfig('120000', '5'), {
    deadline: 120000,
    hasValidDeadline: true,
    warningDeadline: -180000,
    hasWarningTime: true,
  });
});

test('marks missing or invalid deadlines as invalid', () => {
  assert.equal(getSessionTimerConfig(undefined).hasValidDeadline, false);
  assert.equal(getSessionTimerConfig('not-a-timestamp').hasValidDeadline, false);
  assert.equal(getSessionTimerConfig('0').hasValidDeadline, false);
});

test('calculates remaining seconds by rounding up and never going below zero', () => {
  assert.equal(getRemainingSeconds(3_501, 1_000), 3);
  assert.equal(getRemainingSeconds(3_000, 1_000), 2);
  assert.equal(getRemainingSeconds(500, 1_000), 0);
});
