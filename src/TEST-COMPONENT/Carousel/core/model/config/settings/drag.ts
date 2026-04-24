import type { DragConfig, DragSpeedConfig } from "../../../../../../shared";
import {
  DEFAULT_DRAG_CONFIG,
  DEFAULT_DRAG_SPEED_CONFIG,
} from "../../../../../../shared";

const CAROUSEL_DRAG_CONFIG_OVERRIDE: Partial<DragConfig> = {
  // После отпускания свайпа новые drag/click-жесты игнорируются на это время.
  // Больше значение -> меньше случайных повторных действий сразу после release.
  COOLDOWN_MS: 150,

  // Сколько пикселей палец должен пройти по горизонтали, чтобы press стал drag.
  // Больше значение -> меньше случайных drag, но карусель позже начинает следовать пальцу.
  INTENT_THRESHOLD: 8,

  // Насколько жестко лента сопротивляется перетягиванию за край.
  // Больше значение -> палец может уйти дальше, но лента заметнее упирается в границу.
  RESISTANCE: 0.5,

  // Как быстро resistance усиливается по мере дальнейшего overdrag за край.
  // Больше значение -> "резина" быстрее становится жесткой на длинном протягивании.
  RESISTANCE_CURVATURE: 0.004,

  // Safety cap для измеренной скорости пальца/ленты в px/ms.
  // Это защита от шумных pointer-event spikes, а не настройка скорости анимации.
  MAX_VELOCITY: 4.5,

  // Вес последнего velocity-сэмпла в сглаживании EMA.
  // Больше значение -> release сильнее отражает последние движения пальца; меньше -> скорость стабильнее, но менее отзывчива.
  EMA_ALPHA: 0.8,

  // Минимальная raw-скорость пальца в px/ms, при которой короткий жест считается quick flick.
  // Меньше значение -> резкий короткий свайп легче засчитывается как переход.
  SWIPE_VELOCITY_LIMIT: 0.5,

  // Минимальная raw-дистанция пальца для quick flick.
  // Не дает микродрожанию на месте считаться намеренным быстрым свайпом.
  QUICK_SWIPE_MIN_OFFSET: 10,

  // Минимальная raw-дистанция пальца для обычного distance-based swipe.
  // Больше значение -> нужно дальше протянуть палец, если жест не был достаточно быстрым.
  MIN_SWIPE_DISTANCE: 20,

  // Доля ширины viewport, которую нужно протянуть для обычного swipe-решения.
  // Больше значение -> переключение без быстрого flick требует более длинного протягивания.
  SWIPE_THRESHOLD_RATIO: 0.16,
} as const;

const CAROUSEL_DRAG_SPEED_CONFIG_OVERRIDE: Partial<DragSpeedConfig> = {
  // Во сколько раз release должен быть быстрее обычного MOVE, чтобы inertiaBoost применился полностью.
  // 1 = полный boost сразу после превышения normal-speed; 1.35 = полный boost при скорости на 35% выше normal MOVE.
  inertiaBoostRampEndRatio: 1.15,

  // Нижняя граница gesture-duration как доля от обычной duration этого же пути.
  // Меньше значение -> быстрый release может завершаться заметно резче.
  minDurationRatio: 0.14,

  // Абсолютная нижняя граница gesture-duration в миллисекундах.
  // Не дает даже очень быстрому flick превратиться в визуальный телепорт.
  minDuration: 200,

  // Множитель "избыточной" release-скорости после прохождения boost-ramp.
  // 1 = без усиления; 2-3 делают уверенный flick заметно инерционнее, но скорость ниже normal MOVE не ускоряют.
  inertiaBoost: 3,

  // Доля оставшегося release-пути для плавного разгона от текущей скорости ленты к gesture-speed.
  // Это доля расстояния, а не времени.
  releaseAccelerationDistanceShare: 0.25,

  // Доля оставшегося release-пути для плавного торможения к target.
  // Если сумма acceleration + deceleration меньше 1, середина пути становится cruise-зоной.
  releaseDecelerationDistanceShare: 0.35,
} as const;

export const CAROUSEL_DRAG_CONFIG: Required<DragConfig> = {
  ...DEFAULT_DRAG_CONFIG,
  ...CAROUSEL_DRAG_CONFIG_OVERRIDE,
};

export const CAROUSEL_DRAG_SPEED_CONFIG: DragSpeedConfig = {
  ...DEFAULT_DRAG_SPEED_CONFIG,
  ...CAROUSEL_DRAG_SPEED_CONFIG_OVERRIDE,
};
