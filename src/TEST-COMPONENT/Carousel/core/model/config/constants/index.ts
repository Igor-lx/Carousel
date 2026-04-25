// Render-window buffer in slide steps, >= 1.
// Larger value keeps more neighboring slides mounted around the viewport.
export const RENDER_WINDOW_BUFFER_MULTIPLIER = 2;

// Repeated-click position comparison tolerance, > 0.
export const REPEATED_CLICK_EPSILON = 0.0001;

// Motion position/velocity comparison tolerance, > 0.
export const MOTION_EPSILON = 0.0001;

// Snap-stop tolerance after drag release, > 0.
// Smaller value -> target must match more precisely to count as already settled.
export const CAROUSEL_DRAG_RELEASE_EPSILON = 0.001;

// Internal gesture inertia ramp boundary.
// 1 means full inertia boost starts as soon as release speed exceeds normal MOVE speed.
export const DRAG_INERTIA_BOOST_RAMP_END_RATIO = 1.35;
