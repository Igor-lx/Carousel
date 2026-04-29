import {
  AUTO_BEZIER,
  JUMP_BEZIER,
  MOVE_BEZIER,
  SNAP_BACK_BEZIER,
} from "../config";
import type { AnimationMode, MoveReason } from "../reducer";
import type { CubicBezier } from "./types";

const LINEAR_BEZIER: CubicBezier = {
  x1: 0,
  y1: 0,
  x2: 1,
  y2: 1,
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const getCarouselMotionBezier = (
  animationMode: AnimationMode,
  moveReason: MoveReason,
) => {
  if (animationMode === "jump") return JUMP_BEZIER;
  if (animationMode === "snap") return SNAP_BACK_BEZIER;

  switch (moveReason) {
    case "autoplay":
      return AUTO_BEZIER;
    case "gesture":
    case "click":
    default:
      return MOVE_BEZIER;
  }
};

export const parseMotionBezier = (bezier: string): CubicBezier => {
  if (bezier.trim().toLowerCase() === "linear") {
    return LINEAR_BEZIER;
  }

  const match =
    /cubic-bezier\(\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)/i.exec(
      bezier,
    );

  if (!match) {
    return LINEAR_BEZIER;
  }

  const x1 = Number.parseFloat(match[1] ?? "");
  const y1 = Number.parseFloat(match[2] ?? "");
  const x2 = Number.parseFloat(match[3] ?? "");
  const y2 = Number.parseFloat(match[4] ?? "");

  if (
    !Number.isFinite(x1) ||
    !Number.isFinite(y1) ||
    !Number.isFinite(x2) ||
    !Number.isFinite(y2)
  ) {
    return LINEAR_BEZIER;
  }

  return {
    x1: clamp(x1, 0, 1),
    y1,
    x2: clamp(x2, 0, 1),
    y2,
  };
};

const cubicBezierValue = (
  t: number,
  firstControlPoint: number,
  secondControlPoint: number,
) => {
  const inverse = 1 - t;

  return (
    3 * inverse * inverse * t * firstControlPoint +
    3 * inverse * t * t * secondControlPoint +
    t * t * t
  );
};

const cubicBezierDerivative = (
  t: number,
  firstControlPoint: number,
  secondControlPoint: number,
) => {
  const inverse = 1 - t;

  return (
    3 * inverse * inverse * firstControlPoint +
    6 * inverse * t * (secondControlPoint - firstControlPoint) +
    3 * t * t * (1 - secondControlPoint)
  );
};

const solveBezierT = (bezier: CubicBezier, progress: number) => {
  const target = clamp(progress, 0, 1);
  let t = target;

  for (let i = 0; i < 5; i += 1) {
    const x = cubicBezierValue(t, bezier.x1, bezier.x2);
    const derivative = cubicBezierDerivative(t, bezier.x1, bezier.x2);

    if (Math.abs(x - target) < 0.000001 || Math.abs(derivative) < 0.000001) {
      break;
    }

    t = clamp(t - (x - target) / derivative, 0, 1);
  }

  let lower = 0;
  let upper = 1;

  for (let i = 0; i < 8; i += 1) {
    const x = cubicBezierValue(t, bezier.x1, bezier.x2);
    if (Math.abs(x - target) < 0.000001) {
      break;
    }

    if (x < target) {
      lower = t;
    } else {
      upper = t;
    }

    t = (lower + upper) / 2;
  }

  return t;
};

export const sampleMotionBezier = (bezier: CubicBezier, progress: number) => {
  const t = solveBezierT(bezier, progress);
  const eased = clamp(cubicBezierValue(t, bezier.y1, bezier.y2), 0, 1);
  const dx = cubicBezierDerivative(t, bezier.x1, bezier.x2);
  const dy = cubicBezierDerivative(t, bezier.y1, bezier.y2);
  const slope = Math.abs(dx) > 0.000001 ? dy / dx : 0;

  return {
    progress: eased,
    slope: Number.isFinite(slope) ? slope : 0,
  };
};
