import { memo } from "react";
import { NavZone } from "./NavZone";
import type { ControlsViewProps } from "../types";

export const ControlsView = memo(
  ({
    showAtStart,
    showAtEnd,
    onPrev,
    onNext,
    styles,
  }: ControlsViewProps) => {
    return (
      <>
        {showAtStart && (
          <NavZone direction="left" onClick={onPrev} styles={styles} />
        )}
        {showAtEnd && (
          <NavZone direction="right" onClick={onNext} styles={styles} />
        )}
      </>
    );
  },
);
