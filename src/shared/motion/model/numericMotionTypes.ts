export interface NumericMotionSample<Strategy extends string = string> {
  progress: number;
  value: number;
  velocity: number;
  target: number;
  strategy: Strategy;
  timestamp: number;
  phase: "idle" | "running" | "settled";
}

export interface NumericMotionSegmentBase<Strategy extends string = string> {
  strategy: Strategy;
  from: number;
  to: number;
  duration: number;
  startedAt: number;
}

export interface NumericMotionSampleData<Strategy extends string = string> {
  progress: number;
  value: number;
  velocity: number;
  target: number;
  strategy: Strategy;
}

export type NumericMotionSegmentSampler<
  Segment extends NumericMotionSegmentBase<Strategy>,
  Strategy extends string = string,
> = (segment: Segment, timestamp: number) => NumericMotionSampleData<Strategy>;

export type NumericMotionSubscriber<Strategy extends string = string> = (
  sample: NumericMotionSample<Strategy>,
) => void;

export type NumericMotionCompletionMode = "immediate" | "next-frame";

export interface NumericMotionStartOptions<
  Segment extends NumericMotionSegmentBase<Strategy>,
  Strategy extends string = string,
> {
  segment: Segment;
  sampler: NumericMotionSegmentSampler<Segment, Strategy>;
  onComplete?: (sample: NumericMotionSample<Strategy>) => void;
  completion?: NumericMotionCompletionMode;
}

export interface NumericMotionSetOptions<Strategy extends string = string> {
  velocity?: number;
  target?: number;
  strategy?: Strategy;
  progress?: number;
  phase?: NumericMotionSample<Strategy>["phase"];
}

export interface NumericMotionSnapOptions<Strategy extends string = string>
  extends NumericMotionSetOptions<Strategy> {
  onComplete?: (sample: NumericMotionSample<Strategy>) => void;
  completion?: NumericMotionCompletionMode;
}

export interface NumericMotionController<Strategy extends string = string> {
  read: () => NumericMotionSample<Strategy>;
  isActive: () => boolean;
  subscribe: (
    listener: NumericMotionSubscriber<Strategy>,
    options?: { emitCurrent?: boolean },
  ) => () => void;
  start: <Segment extends NumericMotionSegmentBase<Strategy>>(
    options: NumericMotionStartOptions<Segment, Strategy>,
  ) => void;
  set: (value: number, options?: NumericMotionSetOptions<Strategy>) => void;
  snap: (value: number, options?: NumericMotionSnapOptions<Strategy>) => void;
  cancel: () => void;
  destroy: () => void;
}

export interface NumericMotionValueSource {
  getSnapshot: () => number;
  subscribe: (listener: (value: number) => void) => () => void;
}
