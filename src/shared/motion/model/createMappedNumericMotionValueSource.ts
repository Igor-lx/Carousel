import type {
  NumericMotionController,
  NumericMotionSample,
  NumericMotionValueSource,
} from "./numericMotionTypes";

export const createMappedNumericMotionValueSource = <
  Strategy extends string,
>(
  controller: NumericMotionController<Strategy>,
  mapper: (sample: NumericMotionSample<Strategy>) => number,
): NumericMotionValueSource => ({
  getSnapshot: () => mapper(controller.read()),
  subscribe: (listener) =>
    controller.subscribe((sample) => listener(mapper(sample)), {
      emitCurrent: true,
    }),
});
