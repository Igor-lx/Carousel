import { resolveReleaseDuration } from "./model/releaseMotionDuration";
import { resolveReleasePlan } from "./model/releaseMotionPlan";
import {
  getAverageSpeedForDistance,
  getSameDirectionSpeed,
  getSignedVelocity,
} from "./model/speed";
import { toComponentUnitVelocity } from "./model/units";

export const velocityEngine = {
  units: {
    toComponentUnitVelocity,
  },
  speed: {
    getAverageSpeedForDistance,
    getSameDirectionSpeed,
    getSignedVelocity,
  },
  release: {
    resolveDuration: resolveReleaseDuration,
    resolvePlan: resolveReleasePlan,
  },
} as const;
