import type { RefObject } from "react";

import { useIsomorphicLayoutEffect } from "../../shared";
import type { CarouselExternalController } from "./types";

interface ExternalControllerSyncProps {
  externalControllerRef: RefObject<CarouselExternalController | null>;
  isReducedMotion: boolean;
  actualDuration: number;
}

export function useCarouselExternalControllerSync({
  externalControllerRef,
  isReducedMotion,
  actualDuration,
}: ExternalControllerSyncProps): void {
  useIsomorphicLayoutEffect(() => {
    externalControllerRef.current?.toggleFreezed(isReducedMotion);
  }, [isReducedMotion, externalControllerRef]);

  useIsomorphicLayoutEffect(() => {
    externalControllerRef.current?.setDuration(actualDuration);
  }, [actualDuration, externalControllerRef]);
}
