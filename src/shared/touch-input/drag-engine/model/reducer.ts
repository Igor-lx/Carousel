import type { DragEngineAction, DragEngineState } from "./types";

export const initialState: DragEngineState = {
  phase: "IDLE",
};

export function dragEngineReducer(
  state: DragEngineState,
  action: DragEngineAction,
): DragEngineState {
  switch (action.type) {
    case "SET_PHASE":
      return state.phase === action.phase ? state : { phase: action.phase };
    default:
      return state;
  }
}
