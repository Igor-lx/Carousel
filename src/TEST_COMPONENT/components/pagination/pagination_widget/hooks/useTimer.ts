import { useRef, useCallback, useEffect } from "react";

export function useTimer() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const set = useCallback(
    (fn: () => void, delay: number) => {
      clear();
      timerRef.current = setTimeout(fn, delay);
    },
    [clear],
  );

  useEffect(() => () => clear(), [clear]);

  return { set, clear };
}
