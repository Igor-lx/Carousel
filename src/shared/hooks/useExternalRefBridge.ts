import {
  useRef,
  Children,
  isValidElement,
  cloneElement,
  useMemo,
  useCallback,
  Fragment,
  type ReactNode,
  type RefObject,
} from "react";

const canAcceptRef = (type: any): boolean => {
  if (!type || typeof type !== "object") return false;
  if (typeof type.render === "function") return true;
  if (type.type) return canAcceptRef(type.type);
  return false;
};

interface BridgeResult<T> {
  instanceRef: RefObject<T | null>;
  connectedChildren: ReactNode;
}

export function useExternalRefBridge<T>(children: ReactNode): BridgeResult<T> {
  const instanceRef = useRef<T | null>(null);

  const setBridgeRef = useCallback((node: T | null, originalRef: any) => {
    instanceRef.current = node;

    if (!originalRef) return;

    if (typeof originalRef === "function") {
      originalRef(node);
    } else if (originalRef && "current" in originalRef) {
      originalRef.current = node;
    }
  }, []);

  const connectedChildren = useMemo(() => {
    let refAttached = false;

    return Children.map(children, (child) => {
      if (!isValidElement(child)) return child;

      const type = child.type;

      if (typeof type === "string" || type === Fragment) {
        return child;
      }
      if (!canAcceptRef(type) || refAttached) {
        return child;
      }

      refAttached = true;
      const originalRef = (child as any).ref;

      return cloneElement(child as any, {
        ref: (node: T | null) => setBridgeRef(node, originalRef),
      });
    });
  }, [children, setBridgeRef]);

  return {
    instanceRef,
    connectedChildren,
  };
}
