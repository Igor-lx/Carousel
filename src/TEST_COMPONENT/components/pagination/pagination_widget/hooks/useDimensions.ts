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
  const [dimentions, setDimentions] = useState<Dimensions>({ size: 0, gap: 0 });

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const style = getComputedStyle(el);
      const size = parseInt(style.getPropertyValue("--dot-size"), 10);
      const gap = parseInt(style.getPropertyValue("--dots-gap"), 10);

      setDimentions({
        size: isNaN(size) ? 0 : size,
        gap: isNaN(gap) ? 0 : gap,
      });
    };

    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [containerRef]);

  return dimentions;
}
