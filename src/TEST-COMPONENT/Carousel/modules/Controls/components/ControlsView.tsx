import { memo } from "react";
import { NavigationZone } from "./NavigationZone";
import type { ControlsViewProps } from "../types";

export const ControlsView = memo(
  ({
    canMovePrev,
    canMoveNext,
    onPrev,
    onNext,
    classNames,
  }: ControlsViewProps) => {
    return (
      <>
        {canMovePrev && (
          <NavigationZone
            direction="left"
            onClick={onPrev}
            classNames={classNames}
          />
        )}
        {canMoveNext && (
          <NavigationZone
            direction="right"
            onClick={onNext}
            classNames={classNames}
          />
        )}
      </>
    );
  },
);
