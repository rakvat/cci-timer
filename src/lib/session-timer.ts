export type SessionTimerConfig = {
  deadline: number;
  hasValidDeadline: boolean;
  warningDeadline: number;
  hasWarningTime: boolean;
};

export function getSessionTimerConfig(
  deadlineParam?: string,
  warningTimeParam?: string,
): SessionTimerConfig {
  const deadline = Number(deadlineParam);
  const warningTime = Number(warningTimeParam);
  const hasValidDeadline = Number.isFinite(deadline) && deadline > 0;
  const hasWarningTime = Number.isFinite(warningTime) && warningTime > 0;

  return {
    deadline,
    hasValidDeadline,
    warningDeadline: deadline - warningTime * 60_000,
    hasWarningTime,
  };
}

export function getRemainingSeconds(deadline: number, now = Date.now()): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
