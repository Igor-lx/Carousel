// Резервная длительность (ms), > 0.
// Используется как последний безопасный fallback для duration-полей.
export const SAFE_DURATION = 100;

// Минимальный интервал автоплея (ms), > 0.
// Меньше значение запрещено, чтобы таймер не обгонял анимацию.
export const MIN_AUTOPLAY_INTERVAL = 100;

// Нижняя граница числа видимых слайдов, >= 1.
export const MIN_VISIBLE_SLIDES = 1;

// Нижняя граница буфера render-window, >= 1.
export const MIN_RENDER_WINDOW_BUFFER_MULTIPLIER = 1;

// Порог dev-предупреждения для слишком длинного jump (ms), > 0.
// Выше значение -> позже срабатывает UX-warning.
export const MAX_REASONABLE_JUMP_DURATION = 3000;

// Нижняя граница advance-позиции repeated-click (0..1).
export const MIN_REPEATED_CLICK_DESTINATION_POSITION = 0;
// Верхняя граница advance-позиции repeated-click (0..1).
export const MAX_REPEATED_CLICK_DESTINATION_POSITION = 1;
// Нижняя граница ускорения repeated-click, >= 1.
export const MIN_REPEATED_CLICK_SPEED_MULTIPLIER = 1;

// Нижняя граница visibility-threshold для autoplay (0..1).
export const MIN_VISIBILITY_THRESHOLD = 0;
// Верхняя граница visibility-threshold для autoplay (0..1).
export const MAX_VISIBILITY_THRESHOLD = 1;
// Нижняя граница веса EMA для drag-скорости (0..1).
export const MIN_DRAG_EMA_ALPHA = 0;
// Верхняя граница веса EMA для drag-скорости (0..1).
export const MAX_DRAG_EMA_ALPHA = 1;
// Нижняя граница минимальной доли drag-duration (0..1).
export const MIN_DRAG_DURATION_RATIO = 0;
// Верхняя граница минимальной доли drag-duration (0..1).
export const MAX_DRAG_DURATION_RATIO = 1;

// Жёсткий резервный alt-текст, если вход и fallback пусты.
export const HARD_ERROR_ALT_PLACEHOLDER = "Downloading Error";

// Жёсткий fallback layout-настроек при полной порче runtime-config.
export const HARD_LAYOUT_SETTINGS = {
  // Нижняя граница clampedVisible, >= 1.
  minVisibleSlides: 1,
  // Число соседних страниц в render-window, >= 1.
  renderWindowBufferMultiplier: 2,
} as const;

// Жёсткий fallback repeated-click настроек при полной порче runtime-config.
export const HARD_REPEATED_CLICK_SETTINGS = {
  // Доля следующего шага, на которой заканчивается advance-фаза (0..1).
  // Больше значение -> первая фаза repeated-click уходит дальше вперёд.
  destinationPosition: 0.65,
  // Ускорение advance-фазы, >= 1.
  // Больше значение -> первая фаза repeated-click короче.
  speedMultiplier: 9,
  // Числовой допуск repeated-click планирования, > 0.
  // Меньше значение -> строже разделяются почти совпавшие virtualIndex.
  epsilon: 0.0001,
} as const;

// Жёсткий fallback interaction-настроек при полной порче runtime-config.
export const HARD_INTERACTION_SETTINGS = {
  // Задержка автопаузы после hover (ms), >= 0.
  // Больше значение -> позже останавливается autoplay.
  hoverPauseDelay: 150,
  // Порог видимости root-элемента (0..1).
  // Больше значение -> нужно больше видимой площади для autoplay.
  visibilityThreshold: 0.2,
  // Доля autoplay-длительности для визуального догона пагинации (0..1).
  // Больше значение -> позже переключается активная точка.
  autoplayPaginationFactor: 0.4,
} as const;

// Жёсткий fallback drag-настроек при полной порче runtime-config.
export const HARD_DRAG_SETTINGS = {
  // Окно блокировки click после drag (ms), >= 0.
  COOLDOWN_MS: 150,
  // Порог захвата жеста (px), >= 0.
  INTENT_THRESHOLD: 8,
  // Базовая сила сопротивления трека, >= 0.
  RESISTANCE: 0.5,
  // Кривизна нарастания сопротивления, >= 0.
  RESISTANCE_CURVATURE: 0.004,
  // Верхняя граница учитываемой release-скорости, > 0.
  MAX_VELOCITY: 4.5,
  // Вес нового velocity-сэмпла в EMA (0..1).
  EMA_ALPHA: 0.8,
  // Порог page-скорости для quick flick, >= 0.
  SWIPE_VELOCITY_LIMIT: 0.5,
  // Минимальный raw-offset для quick flick (px), >= 0.
  QUICK_SWIPE_MIN_OFFSET: 10,
  // Абсолютный минимум raw-offset для commit swipe (px), >= 0.
  MIN_SWIPE_DISTANCE: 20,
  // Доля ширины страницы для обычного swipe, >= 0.
  SWIPE_THRESHOLD_RATIO: 0.16,
  // Числовой допуск snap/release-сравнения, > 0.
  RELEASE_EPSILON: 0.001,
} as const;

// Жёсткий fallback speed-ramp настроек после жеста.
export const HARD_DRAG_DURATION_RAMP_SETTINGS = {
  // Порог скорости для ускорения жеста, >= 0.
  velocityThreshold: 0.4,
  // Точка полного насыщения ramp, >= velocityThreshold.
  rampEnd: 1.35,
  // Нижняя доля от базовой длительности для быстрых жестов (0..1).
  minDurationRatio: 0.14,
  // Абсолютный нижний предел длительности жеста (ms), > 0.
  minDuration: 220,
  // Усиление инерции после отпускания, >= 0.
  inertiaBoost: 4.6,
} as const;

// Жёсткий fallback motion-настроек при полной порче runtime-config.
export const HARD_MOTION_SETTINGS = {
  // Множитель верхнего предела переносимой скорости между motion-сегментами, > 0.
  monotonicSpeedFactor: 3,
  // Максимальная длительность snap-back возврата (ms), > 0.
  snapBackDuration: 900,
  // Числовой допуск motion-планирования, > 0.
  epsilon: 0.0001,
} as const;
