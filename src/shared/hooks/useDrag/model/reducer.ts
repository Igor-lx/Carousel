import type { DragAction, DragState } from "./types";

export const initialState: DragState = {
  phase: "IDLE",
  offset: 0,
  velocity: 0,
};

export function dragReducer(state: DragState, action: DragAction): DragState {
  switch (action.type) {
    case "SET_START":
      return { ...state, phase: "START", offset: 0, velocity: 0 };
    case "SET_DRAG":
      return {
        ...state,
        phase: "DRAGGING",
        offset: action.offset,
        velocity: action.velocity,
      };
    case "SET_IDLE":
      return { ...state, phase: "IDLE", offset: 0, velocity: 0 };
    case "SET_COOLDOWN":
      return { ...state, phase: "COOLDOWN", offset: 0 };
    default:
      return state;
  }
}
