import type { ReactNode, RefObject } from "react";
import { useExternalRefBridge as useSharedExternalRefBridge } from "../../shared";
import type { CarouselExternalController } from "./types";

interface ExternalRefBridgeResult {
  externalRef: RefObject<CarouselExternalController | null>;
  connectedChildren: ReactNode;
}

export function useExternalRefBridge(
  children: ReactNode,
): ExternalRefBridgeResult {
  const { instanceRef: externalRef, connectedChildren } =
    useSharedExternalRefBridge<CarouselExternalController>(children);

  return {
    externalRef,
    connectedChildren,
  };
}
