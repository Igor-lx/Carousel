import type { CarouselLayout } from "../../utilities/types";

export type AnimationMode = "normal" | "jump" | "instant" | "snap" | "none";

export type MoveReason = "click" | "gesture" | "autoplay" | "unknown";

type VirtualIndexSource = {
  fromVirtualIndex?: number;
};

type StepActionBase = VirtualIndexSource & {
  isInstant?: boolean;
  moveReason: MoveReason;
};

export type MoveAction = StepActionBase & {
  type: "MOVE";
  step: number;
};

export type GoToAction = StepActionBase & {
  type: "GO_TO";
  target: number;
};

export type StepAction = MoveAction | GoToAction;

export type StartDragAction = VirtualIndexSource & {
  type: "START_DRAG";
  targetIndex?: number;
};

export type EndDragAction = VirtualIndexSource & {
  type: "END_DRAG";
  isInstant?: boolean;
  targetIndex: number;
  targetVirtualIndex: number;
  isSnap: boolean;
  releaseVelocity: number;
};

export type DragAction = StartDragAction | EndDragAction;

export type EndStepAction = {
  type: "END_STEP";
};

export type LifecycleAction = EndStepAction;

export type Action = StepAction | DragAction | LifecycleAction;

export type ReducerAction = Action & { layout: CarouselLayout };

export interface State {
  currentLayout: CarouselLayout;
  activeIndex: number;
  targetIndex: number;
  fromVirtualIndex: number;
  virtualIndex: number;
  followUpVirtualIndex: number | null;
  isRepeatedClickAdvance: boolean;
  animMode: AnimationMode;
  moveReason: MoveReason;
  gestureReleaseVelocity: number;
}
