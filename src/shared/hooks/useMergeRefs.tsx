import { useMemo, type Ref, type RefObject } from "react";

type Writable<T> = { -readonly [P in keyof T]: T[P] };

export function useMergeRefs<T>(...refs: (Ref<T> | undefined | null)[]) {
  return useMemo(() => {
    if (refs.every((ref) => ref === null || ref === undefined)) {
      return null;
    }

    return (node: T | null) => {
      refs.forEach((ref) => {
        if (!ref) return;

        if (typeof ref === "function") {
          ref(node);
        } else if (ref && typeof ref === "object" && "current" in ref) {
          (ref as Writable<RefObject<T | null>>).current = node;
        }
      });
    };
  }, refs);
}
