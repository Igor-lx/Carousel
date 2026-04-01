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
      return {
        ...state,
        mode: state.mode === "MOVING" ? "MOVING" : "WAITING",
        lastDirection: action.direction,
        // Если уже двигаемся, инкрементируем шаг сразу (подхватится анимацией)
        step:
          state.mode === "MOVING"
            ? state.step + (action.direction === "next" ? 1 : -1)
            : state.step,
      };
    }

    case "START_ANIMATION": {
      if (state.mode !== "WAITING" || !state.lastDirection) return state;
      const delta = state.lastDirection === "next" ? 1 : -1;
      return {
        ...state,
        mode: "MOVING",
        step: state.step + delta,
      };
    }

    case "END_STEP":
      return {
        ...initialState,
        step: Math.round(state.step), // Защита от накопления плавающей точки
      };

    default:
      return state;
  }
}
