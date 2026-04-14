import type { CarouselLayout } from "../../utilities/types";

export type AnimationMode = "normal" | "jump" | "instant" | "snap" | "rebase" | "none";

export type MoveReason = "click" | "gesture" | "autoplay" | "unknown";

type PendingAnimationMode = Extract<AnimationMode, "normal" | "jump">;

export interface PendingTransition {
  targetIndex: number;
  virtualIndex: number;
  animMode: PendingAnimationMode;
  moveReason: MoveReason;
}

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
};

export type EndDragSnapAction = VirtualIndexSource & {
  type: "END_DRAG_SNAP";
};

export type DragAction = StartDragAction | EndDragSnapAction;

export type CommitRebaseAction = {
  type: "COMMIT_REBASE";
};

export type EndStepAction = {
  type: "END_STEP";
};

export type LifecycleAction = CommitRebaseAction | EndStepAction;

export type Action = StepAction | DragAction | LifecycleAction;

export type ReducerAction = Action & { layout: CarouselLayout };

export interface State {
  currentLayout: CarouselLayout;
  activeIndex: number;
  targetIndex: number;
  fromVirtualIndex: number;
  virtualIndex: number;
  animMode: AnimationMode;
  moveReason: MoveReason;
  pendingTransition: PendingTransition | null;
}
