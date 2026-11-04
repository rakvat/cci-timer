import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyDurationText,
  applyWarningText,
  EMPTY_SESSION_INPUT,
  getDeadline,
  getMaxWarningMinutes,
  getRemainingSeconds,
  getSessionTimerConfig,
  getSuggestedWarningMinutes,
  getWarningDeadline,
  withSuggestedWarning,
} from './session-timer.ts';

const input = (durationMinutes: string, warningMinutes = '') => ({ durationMinutes, warningMinutes });

test('duration input keeps up to two digits and rejects zero', () => {
  assert.deepEqual(applyDurationText(EMPTY_SESSION_INPUT, '4a5'), input('45'));
  assert.deepEqual(applyDurationText(EMPTY_SESSION_INPUT, '123'), input('12'));
  assert.deepEqual(applyDurationText(input('5'), '0'), input('5'));
});

test('changing the duration clears a warning time that no longer fits', () => {
  assert.deepEqual(applyDurationText(input('30', '5'), '10'), input('10', '5'));
  assert.deepEqual(applyDurationText(input('30', '5'), '5'), input('5'));
  assert.deepEqual(applyDurationText(input('30', '5'), ''), input(''));
});

test('warning input must be between 1 and duration - 1', () => {
  assert.deepEqual(applyWarningText(input('10'), '9'), input('10', '9'));
  assert.deepEqual(applyWarningText(input('10'), '10'), input('10'));
  assert.deepEqual(applyWarningText(input('10'), '0'), input('10'));
  assert.deepEqual(applyWarningText(input('10', '3'), ''), input('10'));
  assert.deepEqual(applyWarningText(input(''), '3'), input(''));
});

test('max warning minutes', () => {
  assert.equal(getMaxWarningMinutes(''), 99);
  assert.equal(getMaxWarningMinutes('10'), 9);
  assert.equal(getMaxWarningMinutes('1'), 0);
});

test('suggests one tenth of the duration rounded down as warning time', () => {
  assert.equal(getSuggestedWarningMinutes('59'), '5');
  assert.equal(getSuggestedWarningMinutes('9'), '');
  assert.deepEqual(withSuggestedWarning(input('59')), input('59', '5'));
  assert.deepEqual(withSuggestedWarning(input('59', '2')), input('59', '2'));
});

test('computes deadline timestamps from minutes', () => {
  assert.equal(getDeadline('2', 1_000), 121_000);
  assert.equal(getWarningDeadline(121_000, '1'), 61_000);
  assert.equal(getWarningDeadline(121_000, ''), undefined);
});

test('parses deadline and warning deadline timestamps from route params', () => {
  assert.deepEqual(getSessionTimerConfig('120000', '110000'), {
    deadline: 120000,
    hasValidDeadline: true,
    warningDeadline: 110000,
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
