import { memo } from "react";
import clsx from "clsx";
import type { NavZoneProps } from "../types";
import { ChevronIcon } from "../../../../shared";

export const NavZone = memo(
  ({ direction, onClick, classNames }: NavZoneProps) => {
    const directionClassName =
      direction === "left" ? classNames.navZoneL : classNames.navZoneR;

    return (
      <button
        type="button"
        className={clsx(classNames.navZone, directionClassName)}
        onClick={onClick}
        aria-label={direction === "left" ? "Previous slide" : "Next slide"}
      >
        <div aria-hidden="true" className={classNames.navButton}>
          <ChevronIcon direction={direction} />
        </div>
      </button>
    );
  },
);
