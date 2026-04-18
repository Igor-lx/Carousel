export const mod = (value: number, total: number) => {
  if (total <= 0) return 0;
  return ((value % total) + total) % total;
};

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

export const normalizePageIndex = (pageIndex: number, pageCount: number) => {
  if (pageCount <= 0) return 0;
  return mod(pageIndex, pageCount);
};

export const getShortestDistance = (
  from: number,
  to: number,
  total: number,
) => {
  if (total <= 0) return 0;

  const forward = mod(to - from, total);
  const backward = forward - total;

  return Math.abs(forward) <= Math.abs(backward) ? forward : backward;
};

export const scaleVirtualVelocityToPageVelocity = (
  virtualVelocity: number,
  pageSize: number,
) => {
  if (!Number.isFinite(virtualVelocity) || !(pageSize > 0)) {
    return 0;
  }

  return (virtualVelocity * 1000) / pageSize;
};
