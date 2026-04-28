import { memo, useMemo } from "react";
import { ControlsView } from "./components/ControlsView";
import { useCarouselModuleContext } from "../../core/model/context";
import type { CarouselSlotComponent } from "../../core/model/slots";
import type { ControlsProps } from "./types";
import styles from "./Controls.module.scss";
import { mergeStyles } from "../../../../shared";

const ControlsBase = memo(({ className }: ControlsProps) => {
  const { canMovePrev, canMoveNext, handlePrev, handleNext } =
    useCarouselModuleContext();

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

export const Controls = ControlsBase as CarouselSlotComponent<
  typeof ControlsBase,
  "controls"
>;

Controls.slot = "controls";
