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

const getDirectionOffset = (direction: "next" | "prev") =>
  direction === "next" ? 1 : -1;

export function paginationWidgetReducer(
  state: PaginationWidgetState,
  action: PaginationWidgetAction,
): PaginationWidgetState {
  switch (action.type) {
    case "CLICK": {
      const isMoving = state.mode === "MOVING";
      const directionOffset = getDirectionOffset(action.direction);

      return {
        ...state,
        requestId: state.requestId + 1,
        mode: isMoving ? "MOVING" : "WAITING",
        lastDirection: action.direction,
        step: isMoving ? state.step + directionOffset : state.step,
      };
    }
    case "START_ANIMATION": {
      if (state.mode !== "WAITING" || !state.lastDirection) return state;
      return {
        ...state,
        mode: "MOVING",
        step: state.step + getDirectionOffset(state.lastDirection),
      };
    }
    case "END_STEP":
      return {
        ...initialPaginationWidgetState,
        step: Math.round(state.step),
      };
    case "RESET": {
      const resetStep = Math.round(state.step);

      return {
        ...initialPaginationWidgetState,
        step: resetStep,
      };
    }
    default:
      return state;
  }
}
