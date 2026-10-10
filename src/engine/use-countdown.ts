import { useCallback, useEffect, useState } from 'react';

export interface Countdown {
  secondsLeft: number;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

/**
 * A pausable countdown timer, ticking once a second from `seconds` down to
 * 0. Generic enough for any game needing a time limit or a stopwatch-style
 * display -- not currently wired into Minesweeper (which has no timer
 * today), but available for the next game in this template that needs one.
 */
export function useCountdown(seconds: number): Countdown {
  const [secondsLeft, setSecondsLeft] = useState(seconds);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [paused]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);
  const reset = useCallback(() => {
    setSecondsLeft(seconds);
    setPaused(false);
  }, [seconds]);

  return { secondsLeft, pause, resume, reset };
}
