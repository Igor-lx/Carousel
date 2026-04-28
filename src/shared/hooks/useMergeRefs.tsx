import { useCallback, useRef, type Ref, type RefObject } from "react";

type Writable<T> = { -readonly [P in keyof T]: T[P] };

export function useMergeRefs<T>(...refs: (Ref<T> | undefined | null)[]) {
  const refsRef = useRef(refs);
  refsRef.current = refs;

  const mergedRef = useCallback((node: T | null) => {
    refsRef.current.forEach((ref) => {
      if (!ref) return;

      if (typeof ref === "function") {
        ref(node);
      } else if (ref && typeof ref === "object" && "current" in ref) {
        (ref as Writable<RefObject<T | null>>).current = node;
      }
    });
  }, []);

  return refs.some((ref) => ref !== null && ref !== undefined)
    ? mergedRef
    : null;
}
