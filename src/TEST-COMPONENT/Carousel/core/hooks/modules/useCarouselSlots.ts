import { useMemo, type ReactNode, type RefObject } from "react";

import {
  resolveSlots,
  useExternalRefBridge,
} from "../../../../../shared";
import type { CarouselExternalControlHandle } from "../../external-control";
import {
  CAROUSEL_SLOTS,
  type CarouselSlotName,
} from "../../model/slots";

type CarouselSlots = Record<CarouselSlotName, ReactNode>;

interface UseCarouselSlotsResult {
  externalControlRef: RefObject<CarouselExternalControlHandle | null>;
  slots: CarouselSlots;
}

export function useCarouselSlots(children: ReactNode): UseCarouselSlotsResult {
  const {
    instanceRef: externalControlRef,
    connectedChildren: childrenWithExternalControlRef,
  } = useExternalRefBridge<CarouselExternalControlHandle>(children);

  const slots = useMemo(
    () => resolveSlots(childrenWithExternalControlRef, CAROUSEL_SLOTS),
    [childrenWithExternalControlRef],
  );

  return {
    externalControlRef,
    slots,
  };
}
