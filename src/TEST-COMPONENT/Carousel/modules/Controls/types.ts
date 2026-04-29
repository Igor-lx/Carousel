export interface ControlsClassMap {
  [key: string]: string | undefined;
  navZone?: string;
  navZoneL?: string;
  navZoneR?: string;
  navButton?: string;
}

export interface NavigationZoneProps {
  direction: "left" | "right";
  onClick: () => void;
  classNames: ControlsClassMap;
}

export interface ControlsViewProps {
  canMovePrev: boolean;
  canMoveNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  classNames: ControlsClassMap;
}

export interface ControlsProps {
  className?: ControlsClassMap;
}
