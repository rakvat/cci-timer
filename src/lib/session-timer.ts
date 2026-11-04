const MILLISECONDS_IN_MINUTE = 60_000;

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

export function getDeadline(deadlineParam?: string): number {
  return Date.now() + Number(deadlineParam) * MILLISECONDS_IN_MINUTE;
}

export function getWarningDeadline(deadline: number, warningParam?: string): number | undefined {
  return warningParam ? deadline - Number(warningParam) * MILLISECONDS_IN_MINUTE : undefined;
}

export function getRemainingSeconds(deadline: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
