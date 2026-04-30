import {
  useRef,
  Children,
  isValidElement,
  cloneElement,
  useMemo,
  useCallback,
  Fragment,
  useState,
  type ReactNode,
  type ReactElement,
  type Ref,
  type RefObject,
} from "react";

type WritableRefObject<T> = {
  current: T | null;
};

const canAcceptRef = (type: unknown): boolean => {
  if (!type) return false;

  if (typeof type === "function") {
    return Boolean(
      (type as { prototype?: { isReactComponent?: unknown } }).prototype
        ?.isReactComponent,
    );
  }

  if (typeof type !== "object") return false;
  if (typeof (type as { render?: unknown }).render === "function") return true;
  if ("type" in type) return canAcceptRef((type as { type?: unknown }).type);

  return false;
};

interface BridgeResult<T> {
  instanceRef: RefObject<T | null>;
  instanceVersion: number;
  connectedChildren: ReactNode;
}

export function useExternalRefBridge<T>(children: ReactNode): BridgeResult<T> {
  const instanceRef = useRef<T | null>(null);
  const [instanceVersion, setInstanceVersion] = useState(0);
  const didWarnAboutAmbiguityRef = useRef(false);

  const setBridgeRef = useCallback((node: T | null, originalRef?: Ref<T>) => {
    if (instanceRef.current !== node) {
      setInstanceVersion((version) => version + 1);
    }

    instanceRef.current = node;

    if (!originalRef) return;

    if (typeof originalRef === "function") {
      originalRef(node);
    } else if (typeof originalRef === "object" && "current" in originalRef) {
      (originalRef as WritableRefObject<T>).current = node;
    }
  }, []);

  const connectedChildren = useMemo(() => {
    let refAttached = false;
    let refTargetCount = 0;

    const nextChildren = Children.map(children, (child) => {
      if (!isValidElement(child)) return child;

      const type = child.type;

      if (typeof type === "string" || type === Fragment) {
        return child;
      }

      if (!canAcceptRef(type)) {
        return child;
      }

      refTargetCount += 1;

      if (refAttached) {
        return child;
      }

      refAttached = true;
      const childWithRef = child as ReactElement<{ ref?: Ref<T> }> & {
        ref?: Ref<T>;
      };
      const originalRef = childWithRef.ref ?? childWithRef.props.ref;

      return cloneElement(childWithRef, {
        ref: (node: T | null) => setBridgeRef(node, originalRef),
      });
    });

    if (
      import.meta.env.DEV &&
      refTargetCount > 1 &&
      !didWarnAboutAmbiguityRef.current
    ) {
      didWarnAboutAmbiguityRef.current = true;
      console.warn(
        "[useExternalRefBridge]: Multiple ref-capable children detected. " +
          "The hook will attach to the first matching child, so attachment " +
          "order is significant.",
      );
    }

    return nextChildren;
  }, [children, setBridgeRef]);

  return {
    instanceRef,
    instanceVersion,
    connectedChildren,
  };
}
