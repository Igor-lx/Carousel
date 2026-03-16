import type { CarouselLayout } from "./data.types";

export type AnimationMode = "normal" | "jump" | "instant" | "snap" | "none";
export type MoveReason = "click" | "gesture" | "autoplay" | "unknown";

export type StepAction =
  | { type: "MOVE"; step: number; isInstant?: boolean; moveReason: MoveReason }
  | {
      type: "GO_TO";
      target: number;
      isInstant?: boolean;
      moveReason: MoveReason;
    };

export type Action =
  | StepAction
  | { type: "START_DRAG" }
  | { type: "END_DRAG_SNAP" }
  | { type: "END_STEP" }
  | { type: "RECONCILE"; nextLayout: CarouselLayout }
  | { type: "CLEAR_PENDING" };

export type State = {
  currentIndex: number;
  prevIndex: number | null;
  moveReason: MoveReason;
  animMode: AnimationMode;
  pendingAction: StepAction | null;
  currentLayout: CarouselLayout;
};
