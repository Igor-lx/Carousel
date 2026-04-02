import type { PaginationState, PaginationAction } from "./types";


export const initialState: PaginationState = {
  step: 0,
  mode: "IDLE",
  lastDirection: null,
};

export function paginationReducer(
  state: PaginationState,
  action: PaginationAction,
): PaginationState {
  switch (action.type) {
    case "CLICK": {
      const isMoving = state.mode === "MOVING";
      return {
        ...state,
        mode: isMoving ? "MOVING" : "WAITING",
        lastDirection: action.direction,
        step: isMoving
          ? state.step + (action.direction === "next" ? 1 : -1)
          : state.step,
      };
    }
    case "START_ANIMATION": {
      if (state.mode !== "WAITING" || !state.lastDirection) return state;
      return {
        ...state,
        mode: "MOVING",
        step: state.step + (state.lastDirection === "next" ? 1 : -1),
      };
    }
    case "END_STEP":
      return { ...initialState, step: Math.round(state.step) };
    default:
      return state;
  }
}
