export interface ControlsClassMap {
  [key: string]: string | undefined;
  navZone?: string;
  navZoneL?: string;
  navZoneR?: string;
  navButton?: string;
  touch?: string;
}

export interface NavZoneProps {
  direction: "left" | "right";
  onClick: () => void;
  className: ControlsClassMap;
  isTouch: boolean;
}

export interface ControlsViewProps {
  isAtStart: boolean;
  isAtEnd: boolean;
  onPrev: () => void;
  onNext: () => void;
  className: ControlsClassMap;
  isTouch: boolean;
}

export type ControlsProps = {
  className?: ControlsClassMap;
};
