import type { DragAction, DragState } from "./types";

export const initialState: DragState = {
  phase: "IDLE",
};

export function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case "SET_PHASE":
      return state.phase === action.phase ? state : { phase: action.phase };
    default:
      return state;
  }
}
