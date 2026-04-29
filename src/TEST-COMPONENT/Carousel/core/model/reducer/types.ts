import type { CarouselLayout } from "../../utilities/types";
import type { CarouselRepeatedClickSettings } from "../diagnostic";

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
  targetPageIndex: number;
};

export type StepAction = MoveAction | GoToAction;

export type StartDragAction = VirtualIndexSource & {
  type: "START_DRAG";
  targetPageIndex?: number;
};

export type EndDragAction = VirtualIndexSource & {
  type: "END_DRAG";
  isInstant?: boolean;
  targetPageIndex: number;
  targetVirtualIndex: number;
  isSnap: boolean;
  pointerReleaseVelocity: number;
  uiReleaseVelocity: number;
};

export type DragAction = StartDragAction | EndDragAction;

export type EndStepAction = {
  type: "END_STEP";
};

export type LifecycleAction = EndStepAction;

export type Action = StepAction | DragAction | LifecycleAction;

type ReducerLayoutContext = {
  layout: CarouselLayout;
};

type ReducerInstantMotionContext = {
  isInstant: boolean;
};

type ReducerDragReleaseContext = {
  dragReleaseEpsilon: number;
};

type ReducerRepeatedClickContext = {
  repeatedClickSettings: CarouselRepeatedClickSettings;
};

export type MoveReducerAction = MoveAction &
  ReducerLayoutContext &
  ReducerInstantMotionContext &
  ReducerRepeatedClickContext;

export type GoToReducerAction = GoToAction &
  ReducerLayoutContext &
  ReducerInstantMotionContext;

export type StartDragReducerAction = StartDragAction & ReducerLayoutContext;

export type EndDragReducerAction = EndDragAction &
  ReducerLayoutContext &
  ReducerInstantMotionContext &
  ReducerDragReleaseContext;

export type EndStepReducerAction = EndStepAction & ReducerLayoutContext;

export type ReducerAction =
  | MoveReducerAction
  | GoToReducerAction
  | StartDragReducerAction
  | EndDragReducerAction
  | EndStepReducerAction;

export interface State {
  currentLayout: CarouselLayout;
  activePageIndex: number;
  targetPageIndex: number;
  fromVirtualIndex: number;
  virtualIndex: number;
  followUpVirtualIndex: number | null;
  isRepeatedClickAdvance: boolean;
  animationMode: AnimationMode;
  moveReason: MoveReason;
  gesturePointerReleaseVelocity: number;
  gestureUiReleaseVelocity: number;
}
