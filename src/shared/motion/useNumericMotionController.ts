import { useEffect, useRef } from "react";

import { motionEngine } from "./motionEngine";
import { DEFAULT_NUMERIC_MOTION_STRATEGY } from "./model/numericMotionSample";
import type { NumericMotionController } from "./model/numericMotionTypes";

export function useNumericMotionController<
  Strategy extends string = string,
>(
  initialValue = 0,
  initialStrategy = DEFAULT_NUMERIC_MOTION_STRATEGY as Strategy,
): NumericMotionController<Strategy> {
  const controllerRef = useRef<NumericMotionController<Strategy> | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = motionEngine.createNumericMotionController(
      initialValue,
      initialStrategy,
    );
  }

  useEffect(
    () => () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    },
    [],
  );

  return controllerRef.current;
}
