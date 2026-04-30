import { createMappedNumericMotionValueSource } from "./model/createMappedNumericMotionValueSource";
import { createNumericMotionController } from "./model/createNumericMotionController";

export const motionEngine = {
  createNumericMotionController,
  createMappedNumericMotionValueSource,
} as const;
