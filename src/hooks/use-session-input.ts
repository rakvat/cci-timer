import { useState } from 'react';

import {
  applyDurationText,
  applyWarningText,
  canStartSession,
  EMPTY_SESSION_INPUT,
  getMaxWarningMinutes,
  withSuggestedWarning,
} from '@/lib/session-timer';

export function useSessionInput() {
  const [input, setInput] = useState(EMPTY_SESSION_INPUT);
  const canStart = canStartSession(input);
  const maxWarningMinutes = getMaxWarningMinutes(input.durationMinutes);

  const handleDurationChange = (text: string) => {
    setInput((current) => applyDurationText(current, text));
  };

  const handleWarningChange = (text: string) => {
    setInput((current) => applyWarningText(current, text));
  };

  const fillSuggestedWarning = () => {
    setInput(withSuggestedWarning);
  };

  return {
    input,
    canStart,
    maxWarningMinutes,
    handleDurationChange,
    handleWarningChange,
    fillSuggestedWarning,
  };
}
