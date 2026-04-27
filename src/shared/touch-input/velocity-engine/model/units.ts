export const toComponentUnitVelocity = (
  velocity: number,
  componentUnitSize: number,
) => {
  if (!Number.isFinite(velocity) || !(componentUnitSize > 0)) {
    return 0;
  }

  return velocity / componentUnitSize;
};
