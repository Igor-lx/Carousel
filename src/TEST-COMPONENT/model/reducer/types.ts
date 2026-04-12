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

export type Action =
  | StepAction
  | { type: "START_DRAG"; fromVirtualIndex?: number }
  | { type: "END_DRAG_SNAP"; fromVirtualIndex?: number }
  | { type: "COMMIT_REBASE" }
  | { type: "END_STEP" }
  | { type: "RECONCILE"; nextLayout: CarouselLayout };

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
