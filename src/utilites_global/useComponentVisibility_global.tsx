import {
  type RefObject,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
} from "react";

interface VisibilityProps {
  elementRef?: RefObject<HTMLElement | null>;
  threshold?: number;
}

interface VisibilityResult {
  visible: boolean;
  ref: RefObject<HTMLElement | null>;
}

const DEFAULT_VIS_THRESHOLD = 0.2;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useComponentVisibility({
  elementRef,
  threshold = DEFAULT_VIS_THRESHOLD,
}: VisibilityProps = {}): VisibilityResult {
  const [isVisible, setIsVisible] = useState(false);

  const internalRef = useRef<HTMLElement>(null);
  const activeRef = elementRef || internalRef;

  const isIntersectingRef = useRef(false);

  useIsomorphicLayoutEffect(() => {
    const target = activeRef.current;
    if (!target) return;

    const updateState = () => {
      const isTabActive = document.visibilityState === "visible";
      const nextVisible = isTabActive && isIntersectingRef.current;

      setIsVisible((prev) => (prev === nextVisible ? prev : nextVisible));
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersectingRef.current = entry.isIntersecting;
        updateState();
      },
      { threshold },
    );

    observer.observe(target);
    document.addEventListener("visibilitychange", updateState);

    updateState();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", updateState);
    };
  }, [threshold, activeRef]);

  return {
    visible: isVisible,
    ref: activeRef,
  };
}
