import { memo } from "react";
import clsx from "clsx";

import type { ControlsProps, NavZoneProps } from "./types";
import { ChevronIcon } from "../../../shared";


export const Controls = memo(function Controls({
  isAtStart,
  isAtEnd,
  onPrev,
  onNext,
  className,
}: ControlsProps) {
  return (
    <>
      {!isAtStart && (
        <NavZone direction="left" onClick={onPrev} className={className} />
      )}
      {!isAtEnd && (
        <NavZone direction="right" onClick={onNext} className={className} />
      )}
    </>
  );
});

export const NavZone = memo(
  ({ direction, onClick, className }: NavZoneProps) => {
    const directionStyle =
      direction === "left" ? className.navZoneL : className.navZoneR;

    return (
      <button
        type="button"
        className={clsx(className.navZone, directionStyle)}
        onClick={onClick}
        aria-label={direction === "left" ? "Previous slide" : "Next slide"}
      >
        <div aria-hidden="true" className={className.navButton}>
          <ChevronIcon direction={direction} />
        </div>
      </button>
    );
  },
);
