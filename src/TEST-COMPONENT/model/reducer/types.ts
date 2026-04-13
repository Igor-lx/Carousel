import type { CarouselLayout } from "../../utilites/types";


export type AnimationMode = "normal" | "jump" | "instant" | "snap" | "rebase" | "none";

export type MoveReason = "click" | "gesture" | "autoplay" | "unknown";

export interface PendingTransition {
  targetIndex: number;
  virtualIndex: number;
  animMode: "normal" | "jump";
  moveReason: MoveReason;
}

export type StepAction =
  | {
      type: "MOVE";
      step: number;
      isInstant?: boolean;
      moveReason: MoveReason;
      fromVirtualIndex?: number;
    }
  | {
      type: "GO_TO";
      target: number;
      isInstant?: boolean;
      moveReason: MoveReason;
      fromVirtualIndex?: number;
    };

export type StartDragAction = { type: "START_DRAG"; fromVirtualIndex?: number };
export type EndDragSnapAction = { type: "END_DRAG_SNAP"; fromVirtualIndex?: number };
export type CommitRebaseAction = { type: "COMMIT_REBASE" };
export type EndStepAction = { type: "END_STEP" };

export type Action =
  | StepAction
  | StartDragAction
  | EndDragSnapAction
  | CommitRebaseAction
  | EndStepAction;

export type ReducerAction = Action & { layout: CarouselLayout };

export interface State {
  activeIndex: number;
  targetIndex: number;
  virtualIndex: number;
  fromVirtualIndex: number;
  moveReason: MoveReason;
  animMode: AnimationMode;
  currentLayout: CarouselLayout;
  pendingTransition: PendingTransition | null;
};
