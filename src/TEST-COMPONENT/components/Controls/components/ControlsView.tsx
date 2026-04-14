import { memo } from "react";
import { NavZone } from "./NavZone";
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
          <NavZone direction="left" onClick={onPrev} classNames={classNames} />
        )}
        {canMoveNext && (
          <NavZone direction="right" onClick={onNext} classNames={classNames} />
        )}
      </>
    );
  },
);
