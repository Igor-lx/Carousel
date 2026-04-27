import { mapDragReleaseVelocityToDuration } from "./model/dragReleaseDuration";
import { resolveDragReleaseVelocityPlan } from "./model/dragReleasePlan";
import {
  getAverageSpeedForDistance,
  getSameDirectionSpeed,
  getSignedVelocity,
} from "./model/speed";
import { toComponentUnitVelocity } from "./model/units";

export const velocityEngine = {
  getAverageSpeedForDistance,
  getSameDirectionSpeed,
  getSignedVelocity,
  mapDragReleaseVelocityToDuration,
  resolveDragReleaseVelocityPlan,
  toComponentUnitVelocity,
} as const;
