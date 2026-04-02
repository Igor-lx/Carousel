import {
  useRef,
  Children,
  isValidElement,
  cloneElement,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import type { CarouselExternalController } from "./types";

export const useCarouselBridge = (children: ReactNode) => {
  const externalRef = useRef<CarouselExternalController | null>(null);

  const setBridgeRef = useCallback(
    (node: CarouselExternalController | null, originalRef: any) => {
      externalRef.current = node;

      if (typeof originalRef === "function") {
        originalRef(node);
      } else if (originalRef && "current" in originalRef) {
        originalRef.current = node;
      }
    },
    [],
  );

  const enhancedChildren = useMemo(() => {
    return Children.map(children, (child) => {
      if (!isValidElement(child) || typeof child.type === "string") {
        return child;
      }

      return cloneElement(child as any, {
        ref: (node: CarouselExternalController | null) =>
          setBridgeRef(node, (child as any).ref),
      });
    });
  }, [children, setBridgeRef]);

  return {
    externalRef,
    enhancedChildren,
  };
};
