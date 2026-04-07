import { memo } from "react";
import clsx from "clsx";
import type { NavZoneProps } from "../types";
import { ChevronIcon } from "../../../../shared";

export const NavZone = memo(({ direction, onClick, styles }: NavZoneProps) => {
  const directionStyle =
    direction === "left" ? styles.navZoneL : styles.navZoneR;

  return (
    <button
      type="button"
      className={clsx(styles.navZone, directionStyle)}
      onClick={onClick}
      aria-label={direction === "left" ? "Previous slide" : "Next slide"}
    >
      <div aria-hidden="true" className={styles.navButton}>
        <ChevronIcon direction={direction} />
      </div>
    </button>
  );
});
