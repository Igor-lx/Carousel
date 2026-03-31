import { useState, useLayoutEffect, useEffect } from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface Dimensions {
  size: number;
  gap: number;
}

export function useDimensions(
  containerRef: React.RefObject<HTMLDivElement | null>,
): Dimensions {
  const [dims, setDims] = useState<Dimensions>({ size: 0, gap: 0 });

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const style = getComputedStyle(el);
      const s = parseInt(style.getPropertyValue("--dot-size"), 10);
      const g = parseInt(style.getPropertyValue("--dots-gap"), 10);

      setDims({
        size: isNaN(s) ? 0 : s,
        gap: isNaN(g) ? 0 : g,
      });
    };

    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [containerRef]);

  return dims;
}
