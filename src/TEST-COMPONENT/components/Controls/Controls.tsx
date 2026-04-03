import { memo, useMemo } from "react";
import { ControlsView } from "./components/ControlsView";
import { useCarouselContext } from "../../model/context";
import type { ControlsProps } from "./types";
import { mergeStyles } from "../../../shared";
import styles from "./Controls.module.scss";

export const Controls = memo(({ className }: ControlsProps) => {
  const { isTouch, handlePrev, handleNext, isAtStart, isAtEnd } =
    useCarouselContext();

  const mergedStyles = useMemo(
    () => mergeStyles(styles, className),
    [className],
  );

  return (
    <ControlsView
      isAtStart={isAtStart}
      isAtEnd={isAtEnd}
      onPrev={handlePrev}
      onNext={handleNext}
      isTouch={isTouch}
      className={mergedStyles}
    />
  );
});

(Controls as any).slot = "controls";
