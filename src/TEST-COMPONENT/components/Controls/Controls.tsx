import { memo, useMemo } from "react";
import { ControlsView } from "./components/ControlsView";
import { useCarouselContext } from "../../model/context";
import type { ControlsProps } from "./types";
import styles from "./Controls.module.scss";
import { mergeStyles } from "../../../shared";

export const Controls = memo(({ className }: ControlsProps) => {
  const { handlePrev, handleNext, showAtStart, showAtEnd } =
    useCarouselContext();

  const mergedStyles = useMemo(() => {
    if (!className) return styles;
    return mergeStyles(styles, className);
  }, [className]);

  return (
    <ControlsView
      showAtStart={showAtStart}
      showAtEnd={showAtEnd}
      onPrev={handlePrev}
      onNext={handleNext}
      styles={mergedStyles}
    />
  );
});

(Controls as any).slot = "controls";
