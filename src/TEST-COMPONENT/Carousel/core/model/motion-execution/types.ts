import type { MotionProfile } from "../motion-profile";

export type CarouselMotionStrategy =
  | "easing"
  | "gesture-easing"
  | "gesture"
  | "repeated"
  | "repeated-follow-up"
  | "handoff";

export interface CubicBezier {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface MotionSegmentBase {
  strategy: CarouselMotionStrategy;
  from: number;
  to: number;
  duration: number;
  startedAt: number;
}

export interface EasingMotionSegment extends MotionSegmentBase {
  strategy: "easing" | "gesture-easing";
  easing: CubicBezier;
}

export interface ProfileMotionSegment extends MotionSegmentBase {
  strategy: "gesture" | "repeated" | "repeated-follow-up" | "handoff";
  profile: MotionProfile;
}

export type CarouselMotionSegment =
  | EasingMotionSegment
  | ProfileMotionSegment;

export interface CarouselMotionSample {
  progress: number;
  position: number;
  velocity: number;
  target: number;
  strategy: CarouselMotionStrategy;
}

export interface CarouselMotionHandoffSnapshot {
  position: number;
  velocity: number;
  timestamp: number;
  target: number;
  strategy: CarouselMotionStrategy;
}
