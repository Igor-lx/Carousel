import { MIN_DURATION, VELOCITY_COEFFICIENT } from "./const";
import type { PaginationState, PaginationAction } from "./types";

export const initialState: PaginationState = {
  step: 0,
  animMode: "none",
  activeDelay: 0,
  activeDuration: 0,
};

export function paginationReducer(
  state: PaginationState,
  action: PaginationAction,
): PaginationState {
  const getNext = (dir: "next" | "prev") =>
    dir === "next" ? state.step + 1 : state.step - 1;
  switch (action.type) {
    case "CLICK":
      if (state.animMode === "moving") {
        return {
          ...state,
          step: getNext(action.direction),
          activeDuration: Math.max(
            state.activeDuration * VELOCITY_COEFFICIENT,
            MIN_DURATION,
          ),
          activeDelay: 0,
        };
      }
      return {
        ...state,
        animMode: "waiting",
        activeDuration: action.configDuration,
        activeDelay: state.animMode === "none" ? action.configDelay : 0,
      };
    case "START_ANIMATION":
      return { ...state, animMode: "moving", step: getNext(action.direction) };
    case "END_STEP":
      return { ...state, animMode: "none", activeDelay: 0, activeDuration: 0 };
    default:
      return state;
  }
}
