import clsx from "clsx";
import { memo } from "react";

import { ChevronIcon } from "../../utilites_global";
import type { NavZoneProps } from "../types";


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
