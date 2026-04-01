import { MIN_DURATION, VELOCITY_COEFFICIENT } from "./const";
import type { PaginationState, PaginationAction } from "./types";

export const initialState: PaginationState = {
  step: 0,
  mode: "IDLE",
  activeDelay: 0,
  activeDuration: 0,
  lastDirection: null,
};

export function paginationReducer(
  state: PaginationState,
  action: PaginationAction,
): PaginationState {
  switch (action.type) {
    case "CLICK": {
      const isMoving = state.mode === "MOVING";
      const delta = action.direction === "next" ? 1 : -1;

      if (isMoving) {
        return {
          ...state,
          step: state.step + delta,
          activeDuration: Math.max(
            state.activeDuration * VELOCITY_COEFFICIENT,
            MIN_DURATION,
          ),
          activeDelay: 0,
          lastDirection: action.direction,
        };
      }

      return {
        ...state,
        mode: "WAITING",
        lastDirection: action.direction,
        activeDuration: action.configDuration,
        activeDelay: action.configDelay,
      };
    }

    case "START_ANIMATION": {
      if (state.mode !== "WAITING" || !state.lastDirection) return state;
      const delta = state.lastDirection === "next" ? 1 : -1;
      return {
        ...state,
        mode: "MOVING",
        step: state.step + delta,
        activeDelay: 0,
      };
    }

    case "END_STEP":
      return { ...initialState, step: state.step };

    default:
      return state;
  }
}
