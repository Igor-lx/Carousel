import { memo, useMemo } from "react";
import { ControlsView } from "./components/ControlsView";
import { useCarouselModuleApi } from "../../core/model/context";
import type { ControlsProps } from "./types";
import styles from "./Controls.module.scss";
import { mergeStyles } from "../../../../shared";

export const Controls = memo(({ className }: ControlsProps) => {
  const { canMovePrev, canMoveNext, handlePrev, handleNext } =
    useCarouselModuleApi();

  const classNames = useMemo(() => {
    if (!className) return styles;
    return mergeStyles(styles, className);
  }, [className]);

  return (
    <ControlsView
      canMovePrev={canMovePrev}
      canMoveNext={canMoveNext}
      onPrev={handlePrev}
      onNext={handleNext}
      classNames={classNames}
    />
  );
});

(Controls as any).slot = "controls";
