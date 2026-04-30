export const getMotionTimestamp = () =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

export const scheduleMotionFrame = (callback: FrameRequestCallback) => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.requestAnimationFrame(callback);
};

export const cancelMotionFrame = (frameId: number | null) => {
  if (frameId !== null && typeof window !== "undefined") {
    window.cancelAnimationFrame(frameId);
  }
};
