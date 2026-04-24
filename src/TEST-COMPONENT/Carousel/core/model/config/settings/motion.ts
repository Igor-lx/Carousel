// Позиция внутри следующего page-step, где заканчивается быстрый repeated-click пролет.
// 0.7 означает: долететь до 70% следующего шага, затем перейти в follow-up до финального target.
export const REPEATED_CLICK_DESTINATION_POSITION = 0.65;

// Средняя скорость repeated-click пролета относительно обычного MOVE.
// 2 примерно вдвое быстрее обычного MOVE, 3 примерно втрое, большие значения становятся очень резкими.
export const REPEATED_CLICK_SPEED_MULTIPLIER = 6;

// Доля расстояния repeated-click пролета для разгона от текущей скорости к repeated-speed.
// Это доля пути, а не времени: 0.2 означает первые 20% repeated-сегмента.
export const REPEATED_CLICK_START_ACCELERATION = 0.1;

// Доля расстояния repeated-click пролета для торможения к штатной скорости MOVE.
// Это доля пути от конца repeated-сегмента: 0.5 означает последние 50% repeated-сегмента.
export const REPEATED_CLICK_END_DECELERATION = 0.7;

// Duration snap-back движения после отпуска жеста, если target не переключается.
export const SNAP_BACK_DURATION = 900;

export const JUMP_BEZIER = "cubic-bezier(0.16, 1, 0.3, 1)";
export const MOVE_CLICK_BEZIER = "linear";
export const MOVE_AUTO_BEZIER = "cubic-bezier(0.28, 0.72, 0.38, 1)";
export const MOVE_SWIPE_BEZIER = "cubic-bezier(0.14, 0.92, 0.24, 1)";
export const SNAP_BACK_BEZIER = "cubic-bezier(0.18, 0.82, 0.28, 1)";
