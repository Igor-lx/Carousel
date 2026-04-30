import type {
  PaginationWidgetAction,
  PaginationWidgetState,
} from "./paginationWidgetTypes";

export const initialPaginationWidgetState: PaginationWidgetState = {
  visualOffset: 0,
  requestId: 0,
  mode: "IDLE",
  direction: null,
};

const getDirectionDelta = (
  direction: NonNullable<PaginationWidgetState["direction"]>,
) => (direction === "right" ? 1 : -1);

export function paginationWidgetReducer(
  state: PaginationWidgetState,
  action: PaginationWidgetAction,
): PaginationWidgetState {
  switch (action.type) {
    case "REQUEST_MOVE": {
      const isMoving = state.mode === "MOVING";
      return {
        ...state,
        requestId: state.requestId + 1,
        mode: isMoving ? "MOVING" : "WAITING",
        direction: action.direction,
        visualOffset: isMoving
          ? state.visualOffset + getDirectionDelta(action.direction)
          : state.visualOffset,
      };
    }
    case "BEGIN_MOVE": {
      if (state.mode !== "WAITING" || !state.direction) return state;
      return {
        ...state,
        mode: "MOVING",
        visualOffset: state.visualOffset + getDirectionDelta(state.direction),
      };
    }
    case "COMPLETE_MOVE":
    case "STOP":
      return initialPaginationWidgetState;
    default:
      return state;
  }
}
