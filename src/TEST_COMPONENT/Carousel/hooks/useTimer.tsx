import { useRef, useCallback, useMemo, useEffect } from "react";

export function useCarouselTimer() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const set = useCallback(
    (callback: () => void, delay: number) => {
      clear();
      timerRef.current = setTimeout(callback, delay);
    },
    [clear],
  );

  useEffect(() => {
    return () => clear();
  }, [clear]);

  
  return useMemo(() => ({ set, clear }), [set, clear]);
}
