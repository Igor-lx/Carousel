import {
  useRef,
  Children,
  isValidElement,
  cloneElement,
  useMemo,
  useCallback,
  Fragment,
  type ReactNode,
} from "react";

import type { CarouselExternalController } from "./types";

const canAcceptRef = (type: any): boolean => {
  if (!type || typeof type !== "object") return false;
  if (typeof type.render === "function") return true;
  if (type.type) {
    return canAcceptRef(type.type);
  }
  return false;
};

export const useExternalRefBridge = (children: ReactNode) => {
  const externalRef = useRef<CarouselExternalController | null>(null);

  const setBridgeRef = useCallback(
    (node: CarouselExternalController | null, originalRef: any) => {
      externalRef.current = node;

      if (!originalRef) return;

      if (typeof originalRef === "function") {
        originalRef(node);
      } else if (originalRef && "current" in originalRef) {
        originalRef.current = node;
      }
    },
    [externalRef],
  );

  const connectedChildren = useMemo(() => {
    let refAttached = false;

    return Children.map(children, (child) => {
      if (!isValidElement(child)) return child;

      const type = child.type;
      if (typeof type === "string" || type === Fragment) {
        return child;
      }

      if (!canAcceptRef(type)) {
        return child;
      }

      if (refAttached) return child;
      refAttached = true;

      const originalRef = (child as any).ref;

      return cloneElement(child as any, {
        ref: (node: CarouselExternalController | null) =>
          setBridgeRef(node, originalRef),
      });
    });
  }, [children, setBridgeRef]);

  return {
    externalRef,
    connectedChildren,
  };
};
