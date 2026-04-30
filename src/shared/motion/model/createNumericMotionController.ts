import {
  cancelMotionFrame,
  getMotionTimestamp,
  scheduleMotionFrame,
} from "./motionClock";
import {
  createIdleNumericMotionSample,
  DEFAULT_NUMERIC_MOTION_STRATEGY,
} from "./numericMotionSample";
import type {
  NumericMotionCompletionMode,
  NumericMotionController,
  NumericMotionSample,
  NumericMotionSegmentBase,
  NumericMotionSegmentSampler,
  NumericMotionSetOptions,
  NumericMotionSnapOptions,
  NumericMotionStartOptions,
  NumericMotionSubscriber,
} from "./numericMotionTypes";

interface ActiveNumericMotionSegment<Strategy extends string> {
  sampler: NumericMotionSegmentSampler<
    NumericMotionSegmentBase<Strategy>,
    Strategy
  >;
  segment: NumericMotionSegmentBase<Strategy>;
  onComplete?: (sample: NumericMotionSample<Strategy>) => void;
  completion: NumericMotionCompletionMode;
}

export const createNumericMotionController = <
  Strategy extends string = string,
>(
  initialValue = 0,
  initialStrategy = DEFAULT_NUMERIC_MOTION_STRATEGY as Strategy,
): NumericMotionController<Strategy> => {
  let current = createIdleNumericMotionSample(initialValue, initialStrategy);
  let frameId: number | null = null;
  let completionFrameId: number | null = null;
  let active: ActiveNumericMotionSegment<Strategy> | null = null;
  const listeners = new Set<NumericMotionSubscriber<Strategy>>();

  const cancelAnimation = () => {
    cancelMotionFrame(frameId);
    frameId = null;
  };

  const cancelCompletion = () => {
    cancelMotionFrame(completionFrameId);
    completionFrameId = null;
  };

  const publish = (sample: NumericMotionSample<Strategy>) => {
    current = sample;
    listeners.forEach((listener) => listener(sample));
  };

  const sampleActive = (timestamp: number): NumericMotionSample<Strategy> => {
    if (!active) {
      return current;
    }

    const data = active.sampler(active.segment, timestamp);

    return {
      ...data,
      timestamp,
      phase: data.progress >= 1 ? "settled" : "running",
    };
  };

  const complete = (
    callback: (sample: NumericMotionSample<Strategy>) => void,
    sample: NumericMotionSample<Strategy>,
    completion: NumericMotionCompletionMode = "next-frame",
  ) => {
    cancelCompletion();

    if (completion === "immediate") {
      callback(sample);
      return;
    }

    completionFrameId = scheduleMotionFrame(() => {
      completionFrameId = null;
      callback(sample);
    });

    if (completionFrameId === null) {
      callback(sample);
    }
  };

  const finish = (sample: NumericMotionSample<Strategy>) => {
    const finishedSegment = active;
    cancelAnimation();
    active = null;

    const settledSample: NumericMotionSample<Strategy> = {
      ...sample,
      progress: 1,
      value: sample.target,
      velocity: sample.velocity,
      timestamp: sample.timestamp,
      phase: "settled",
    };

    publish(settledSample);

    if (finishedSegment?.onComplete) {
      complete(
        finishedSegment.onComplete,
        settledSample,
        finishedSegment.completion,
      );
    }
  };

  const step = (timestamp: number) => {
    if (!active) {
      frameId = null;
      return;
    }

    const sample = sampleActive(timestamp);
    publish(sample);

    if (sample.progress >= 1) {
      finish(sample);
      return;
    }

    frameId = scheduleMotionFrame(step);
  };

  const read = () => {
    if (!active) {
      return current;
    }

    const sampled = sampleActive(getMotionTimestamp());
    current = sampled;

    return sampled;
  };

  const isActive = () => active !== null;

  const subscribe = (
    listener: NumericMotionSubscriber<Strategy>,
    options: { emitCurrent?: boolean } = {},
  ) => {
    listeners.add(listener);

    if (options.emitCurrent ?? true) {
      listener(current);
    }

    return () => {
      listeners.delete(listener);
    };
  };

  const start = <Segment extends NumericMotionSegmentBase<Strategy>>({
    segment,
    sampler,
    onComplete,
    completion = "next-frame",
  }: NumericMotionStartOptions<Segment, Strategy>) => {
    cancelAnimation();
    cancelCompletion();

    active = {
      segment,
      sampler: sampler as NumericMotionSegmentSampler<
        NumericMotionSegmentBase<Strategy>,
        Strategy
      >,
      onComplete,
      completion,
    };

    const initialSample = sampleActive(getMotionTimestamp());
    publish(initialSample);

    if (initialSample.progress >= 1) {
      finish(initialSample);
      return;
    }

    frameId = scheduleMotionFrame(step);
  };

  const set = (
    value: number,
    options: NumericMotionSetOptions<Strategy> = {},
  ) => {
    cancelAnimation();
    cancelCompletion();
    active = null;

    publish({
      progress: options.progress ?? 1,
      value,
      velocity: options.velocity ?? 0,
      target: options.target ?? value,
      strategy: options.strategy ?? current.strategy,
      timestamp: getMotionTimestamp(),
      phase: options.phase ?? "idle",
    });
  };

  const snap = (
    value: number,
    options: NumericMotionSnapOptions<Strategy> = {},
  ) => {
    set(value, {
      ...options,
      target: options.target ?? value,
      progress: 1,
      phase: "settled",
    });

    if (options.onComplete) {
      complete(options.onComplete, current, options.completion);
    }
  };

  const cancel = () => {
    cancelAnimation();
    cancelCompletion();
    active = null;

    publish({
      ...current,
      progress: 1,
      timestamp: getMotionTimestamp(),
      phase: "idle",
    });
  };

  const destroy = () => {
    cancel();
    listeners.clear();
  };

  return {
    read,
    isActive,
    subscribe,
    start,
    set,
    snap,
    cancel,
    destroy,
  };
};
