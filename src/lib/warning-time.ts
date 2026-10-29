export function getSuggestedWarningTime(duration: string): string {
  const suggestedTime = Math.floor(Number(duration) / 10);
  return suggestedTime > 0 ? String(suggestedTime) : "";
}
