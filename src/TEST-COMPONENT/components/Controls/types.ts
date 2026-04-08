export interface ControlsClassMap {
  [key: string]: string | undefined;
  navZone?: string;
  navZoneL?: string;
  navZoneR?: string;
  navButton?: string;
  touch?: string;
  reducedMotion?: string;
}

export interface NavZoneProps {
  direction: "left" | "right";
  onClick: () => void;
  styles: ControlsClassMap;
}

export interface ControlsViewProps {
  showAtStart: boolean;
  showAtEnd: boolean;
  onPrev: () => void;
  onNext: () => void;
  styles: ControlsClassMap;
}

export interface ControlsProps {
  className?: ControlsClassMap;
};
