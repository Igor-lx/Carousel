export const scaleVelocityByUnitSize = (
  velocity: number,
  unitSize: number,
) => {
  if (!Number.isFinite(velocity) || !(unitSize > 0)) {
    return 0;
  }

  return velocity / unitSize;
};
