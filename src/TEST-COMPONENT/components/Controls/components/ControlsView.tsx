import { memo } from "react";
import { NavZone } from "./NavZone";
import type { ControlsViewProps } from "../types";

export const ControlsView = memo(
  ({ isAtStart, isAtEnd, onPrev, onNext, className, isTouch }: ControlsViewProps) => {
    return (
      <>
        {!isAtStart && (
          <NavZone direction="left" onClick={onPrev} className={className} isTouch={isTouch} />
        )}
        {!isAtEnd && (
          <NavZone direction="right" onClick={onNext} className={className} isTouch={isTouch} />
        )}
      </>
    );
  },
);
