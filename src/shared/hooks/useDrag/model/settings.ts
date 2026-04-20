import type { CSSProperties } from "react";

export const DRAG_CONFIG = {
  COOLDOWN_MS: 150, // Окно блокировки кликов после завершения драга
  INTENT_THRESHOLD: 8, // Сколько px нужно пройти, чтобы заблокировать скролл и начать драг

  RESISTANCE: 0.7, // Коэффициент сопротивления (1 — не двигается)
  RESISTANCE_CURVATURE: 0.002, // Коэффициент сопротивления (0 — линейное, 0.01 и выше — логарифмическое, чем выше тем быстрее лента упирается в стену при длинном свайпе.)
  MAX_VELOCITY: 5, // Ограничение скорости для стабильности EMA
  EMA_ALPHA: 0.7, // Сглаживание скорости  - чем выше, тем чувствительнее к последнему движению

  SWIPE_VELOCITY_LIMIT: 0.5, // Минимальная скорость для "быстрого" свайпа (flick)
  QUICK_SWIPE_MIN_OFFSET: 10, // Минимальный сдвиг для быстрого свайпа (защита от дерганого тапа)
  MIN_SWIPE_DISTANCE: 20, // Абсолютный минимум в px для свайпа по дистанции
  SWIPE_THRESHOLD_RATIO: 0.2, // Порог свайпа в % от ширины контейнера (0.2 = 20%)
} as const;

export const SHARED_DRAG_STYLES: CSSProperties = {
  touchAction: "pan-y",
  userSelect: "none",
  WebkitUserSelect: "none",
  overscrollBehaviorX: "contain",
  WebkitTapHighlightColor: "transparent",
};
