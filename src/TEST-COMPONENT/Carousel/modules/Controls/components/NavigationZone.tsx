import { memo } from "react";
import clsx from "clsx";
import type { NavigationZoneProps } from "../types";
import { ChevronIcon } from "../../../../../shared";

export const NavigationZone = memo(
  ({ direction, onClick, classNames }: NavigationZoneProps) => {
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
