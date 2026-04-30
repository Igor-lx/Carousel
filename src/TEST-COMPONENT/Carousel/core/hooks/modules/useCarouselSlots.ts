import { useMemo, type ReactNode, type RefObject } from "react";

import {
  resolveSlots,
  useExternalRefBridge,
} from "../../../../../shared";
import {
  CAROUSEL_SLOTS,
  type CarouselSlotName,
} from "../../model/slots";

type CarouselSlots = Record<CarouselSlotName, ReactNode>;

interface UseCarouselSlotsResult {
  externalControlRef: RefObject<unknown | null>;
  externalControlVersion: number;
  slots: CarouselSlots;
}

export function useCarouselSlots(children: ReactNode): UseCarouselSlotsResult {
  const {
    instanceRef: externalControlRef,
    instanceVersion: externalControlVersion,
    connectedChildren: childrenWithExternalControlRef,
  } = useExternalRefBridge<unknown>(children);

  const slots = useMemo(
    () => resolveSlots(childrenWithExternalControlRef, CAROUSEL_SLOTS),
    [childrenWithExternalControlRef],
  );

  return {
    externalControlRef,
    externalControlVersion,
    slots,
  };
}
