import { useMemo } from "react";
import type { CarouselRepeatedClickSettings } from "../../model/diagnostic";

interface UseResponsiveRepeatedClickSettingsProps {
  repeatedClickSettings: CarouselRepeatedClickSettings;
  isTouch: boolean;
}

export function useResponsiveRepeatedClickSettings({
  repeatedClickSettings,
  isTouch,
}: UseResponsiveRepeatedClickSettingsProps): CarouselRepeatedClickSettings {
  return useMemo(() => {
    if (!isTouch) {
      return repeatedClickSettings;
    }

    return {
      ...repeatedClickSettings,
      destinationPosition: repeatedClickSettings.touchDestinationPosition,
    };
  }, [isTouch, repeatedClickSettings]);
}
