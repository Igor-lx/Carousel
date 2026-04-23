import type {
  PaginationWidgetAction,
  PaginationWidgetState,
} from "./paginationWidgetTypes";

export const initialPaginationWidgetState: PaginationWidgetState = {
  step: 0,
  requestId: 0,
  mode: "IDLE",
  lastDirection: null,
};

export function paginationWidgetReducer(
  state: PaginationWidgetState,
  action: PaginationWidgetAction,
): PaginationWidgetState {
  switch (action.type) {
    case "CLICK": {
      const isMoving = state.mode === "MOVING";
      return {
        ...state,
        requestId: state.requestId + 1,
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
      return {
        ...initialPaginationWidgetState,
        step: Math.round(state.step),
      };
    case "RESET":
      return {
        ...initialPaginationWidgetState,
        step: Math.round(state.step),
      };
    default:
      return state;
  }
}
