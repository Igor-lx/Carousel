import type { ClassNameMap } from "../../Carousel.types";

export interface NavZoneProps {
  direction: "left" | "right";
  onClick: () => void;
  className: ClassNameMap;
}

export type ControlsProps = {
  isAtStart: boolean;
  isAtEnd: boolean;
  onPrev: () => void;
  onNext: () => void;
  className: ClassNameMap;
};
