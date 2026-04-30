import type {
  DragEngineConfig,
  ReleaseMotionConfig,
} from "../../../../../../shared";
import {
  DEFAULT_DRAG_ENGINE_CONFIG,
  DEFAULT_RELEASE_MOTION_CONFIG,
} from "../../../../../../shared";

const CAROUSEL_DRAG_CONFIG_OVERRIDE: Partial<DragEngineConfig> = {
  // После отпускания свайпа новые drag/click-жесты игнорируются на это время.
  // Больше значение -> меньше случайных повторных действий сразу после release.
  COOLDOWN_MS: 150,

  // Сколько пикселей палец должен пройти по горизонтали, чтобы press стал drag.
  // Больше значение -> меньше случайных drag, но карусель позже начинает следовать пальцу.
  INTENT_THRESHOLD: 8,

  // Насколько жестко лента сопротивляется перетягиванию за край.
  // Больше значение -> палец может уйти дальше, но лента заметнее упирается в границу.
  RESISTANCE: 0.4,

  // Как быстро resistance усиливается по мере дальнейшего overdrag за край.
  // Больше значение -> "резина" быстрее становится жесткой на длинном протягивании.
  RESISTANCE_CURVATURE: 0.002,

  // Safety cap для измеренной скорости пальца/ленты в px/ms.
  // Это защита от шумных pointer-event spikes, а не настройка скорости анимации.
  MAX_VELOCITY: 5,

  // Вес последнего velocity-сэмпла в сглаживании EMA.
  // Больше значение -> release сильнее отражает последние движения пальца; меньше -> скорость стабильнее, но менее отзывчива.
  EMA_ALPHA: 0.85,

  // Минимальная raw-скорость пальца в px/ms, при которой короткий жест считается quick flick.
  // Меньше значение -> резкий короткий свайп легче засчитывается как переход.
  SWIPE_VELOCITY_LIMIT: 0.1,

  // Минимальная raw-дистанция пальца для quick flick.
  // Не дает микродрожанию на месте считаться намеренным быстрым свайпом.
  QUICK_SWIPE_MIN_OFFSET: 6,

  // Минимальная raw-дистанция пальца для обычного distance-based swipe.
  // Больше значение -> нужно дальше протянуть палец, если жест не был достаточно быстрым.
  MIN_SWIPE_DISTANCE: 20,

  // Доля ширины viewport, которую нужно протянуть для обычного swipe-решения.
  // Больше значение -> переключение без быстрого flick требует более длинного протягивания.
  SWIPE_THRESHOLD_RATIO: 0.25,
} as const;

const CAROUSEL_RELEASE_MOTION_CONFIG_OVERRIDE: Partial<ReleaseMotionConfig> = {
  // Прямой множитель raw release-скорости пальца перед сравнением со штатной MOVE-speed.
  // 1 = честная скорость пальца; 2 = вдвое сильнее.
  // Значения ниже 1 ослабляют только fast-release: итоговое движение все равно не будет медленнее MOVE.
  inertiaBoost: 2.2,

  // Доля оставшегося release-пути для плавного торможения к target.
  // 0.3 = первые 70% пути летим с release-speed, последние 30% тормозим в точную остановку.
  releaseDecelerationDistanceShare: 0.45,
} as const;

// Duration отката после отпускания жеста, если swipe не выбрал новый target.
// Откат проходит фактически оставшуюся дистанцию за это время, без скрытого scaling от page-size.
export const SNAP_BACK_DURATION = 1300;

export const SNAP_BACK_BEZIER = "cubic-bezier(0.18, 0.82, 0.28, 1)";

export const CAROUSEL_DRAG_CONFIG: Required<DragEngineConfig> = {
  ...DEFAULT_DRAG_ENGINE_CONFIG,
  ...CAROUSEL_DRAG_CONFIG_OVERRIDE,
};

export const CAROUSEL_RELEASE_MOTION_CONFIG: ReleaseMotionConfig = {
  ...DEFAULT_RELEASE_MOTION_CONFIG,
  ...CAROUSEL_RELEASE_MOTION_CONFIG_OVERRIDE,
};
