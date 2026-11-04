const MILLISECONDS_IN_MINUTE = 60_000;
export const MAX_MINUTES = 99;

// --- Input: what the user types on the start screen (minutes, kept as strings for the text inputs).

export type SessionInput = {
  durationMinutes: string;
  warningMinutes: string;
};

export const EMPTY_SESSION_INPUT: SessionInput = { durationMinutes: '', warningMinutes: '' };

function toMinutesDigits(text: string): string {
  return text.replace(/\D/g, '').slice(0, String(MAX_MINUTES).length);
}

/** Largest allowed warning time; the warning has to come before the end of the session. */
export function getMaxWarningMinutes(durationMinutes: string): number {
  return durationMinutes === '' ? MAX_MINUTES : Number(durationMinutes) - 1;
}

/** Applies a typed duration; clears the warning time when it no longer fits. Rejects 0. */
export function applyDurationText(input: SessionInput, text: string): SessionInput {
  const durationMinutes = toMinutesDigits(text);
  if (durationMinutes !== '' && Number(durationMinutes) < 1) return input;

  const warningStillFits =
    durationMinutes !== '' &&
    (input.warningMinutes === '' ||
      Number(input.warningMinutes) <= getMaxWarningMinutes(durationMinutes));

  return { durationMinutes, warningMinutes: warningStillFits ? input.warningMinutes : '' };
}

/** Applies a typed warning time; ignores values outside 1 to duration − 1. */
export function applyWarningText(input: SessionInput, text: string): SessionInput {
  const warningMinutes = toMinutesDigits(text);
  const fits =
    warningMinutes === '' ||
    (input.durationMinutes !== '' &&
      Number(warningMinutes) >= 1 &&
      Number(warningMinutes) <= getMaxWarningMinutes(input.durationMinutes));

  return fits ? { ...input, warningMinutes } : input;
}

/** Suggests one tenth of the duration, rounded down, as the warning time. */
export function getSuggestedWarningMinutes(durationMinutes: string): string {
  const suggested = Math.floor(Number(durationMinutes) / 10);
  return suggested > 0 ? String(suggested) : '';
}

/** Fills in the suggested warning time if none was entered yet. */
export function withSuggestedWarning(input: SessionInput = EMPTY_SESSION_INPUT): SessionInput {
  if (input.warningMinutes !== '') return input;
  return { ...input, warningMinutes: getSuggestedWarningMinutes(input.durationMinutes) };
}

export function canStartSession(input: SessionInput): boolean {
  return input.durationMinutes !== '';
}

// --- Deadlines: absolute timestamps in milliseconds.

export function getDeadline(durationMinutes: string, now = Date.now()): number {
  return now + Number(durationMinutes) * MILLISECONDS_IN_MINUTE;
}

export function getWarningDeadline(deadline: number, warningMinutes?: string): number | undefined {
  return warningMinutes ? deadline - Number(warningMinutes) * MILLISECONDS_IN_MINUTE : undefined;
}

// --- Running timer: parsing the route params and counting down.

export type SessionTimerConfig = {
  deadline: number;
  hasValidDeadline: boolean;
  warningDeadline: number;
  hasWarningTime: boolean;
};

export function getSessionTimerConfig(
  deadlineParam?: string,
  warningDeadlineParam?: string,
): SessionTimerConfig {
  const deadline = Number(deadlineParam);
  const hasValidDeadline = Number.isFinite(deadline) && deadline > 0;
  const warningDeadline = Number(warningDeadlineParam);
  const hasWarningTime = Number.isFinite(warningDeadline) && warningDeadline > 0 && warningDeadline < deadline;

  return {
    deadline,
    hasValidDeadline,
    warningDeadline,
    hasWarningTime,
  };
}

export function getRemainingSeconds(deadline: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
