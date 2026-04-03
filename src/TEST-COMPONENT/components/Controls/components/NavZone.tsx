import { memo } from "react";
import clsx from "clsx";

import type { NavZoneProps } from "../types";
import { ChevronIcon } from "../../../../shared";

export const NavZone = memo(
  ({ direction, onClick, className, isTouch }: NavZoneProps) => {
    const directionStyle =
      direction === "left" ? className.navZoneL : className.navZoneR;

    return (
      <button
        type="button"
        className={clsx(className.navZone, isTouch&&className.touch, directionStyle)}
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
