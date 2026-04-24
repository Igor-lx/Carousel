import type { DragConfig, DragSpeedConfig } from "../../../../../../shared";
import {
  DEFAULT_DRAG_CONFIG,
  DEFAULT_DRAG_SPEED_CONFIG,
} from "../../../../../../shared";

const CAROUSEL_DRAG_CONFIG_OVERRIDE: Partial<DragConfig> = {
  COOLDOWN_MS: 150, // пауза после swipe release перед новым жестом (мс).
  // Порог распознавания осознанного drag (px), >= 0.
  // Больше значение -> сложнее войти в drag.
  INTENT_THRESHOLD: 8,
  // Сила "резины" на краях, >= 0.
  // Меньше значение -> сильнее сопротивление выходу за границы.
  RESISTANCE: 0.5,
  // Кривизна нарастания сопротивления, >= 0.
  // Больше значение -> "резина" быстрее усиливается при растяжении.
  RESISTANCE_CURVATURE: 0.004,
  // Верхний предел измеряемой drag/release-скорости (px/ms), > 0.
  // Больше значение -> быстрые жесты меньше срезаются сверху.
  MAX_VELOCITY: 4.5,
  // Вес нового velocity-сэмпла в EMA (0..1).
  // Больше значение -> итоговая скорость сильнее зависит от последних движений жеста.
  EMA_ALPHA: 0.8,
  // Порог скорости для уверенного swipe-решения (px/ms), >= 0.
  // Меньше значение -> свайп легче засчитать по скорости.
  SWIPE_VELOCITY_LIMIT: 0.5,
  // Минимальный сдвиг для быстрого flick-свайпа (px), >= 0.
  // Меньше значение -> короткий резкий жест чаще считается свайпом.
  QUICK_SWIPE_MIN_OFFSET: 10,
  // Минимальная дистанция обычного свайпа (px), >= 0.
  // Больше значение -> требуется длиннее протащить палец.
  MIN_SWIPE_DISTANCE: 20,
  // Доля ширины шага для threshold-свайпа, >= 0.
  // Больше значение -> сложнее перелистнуть без высокой скорости.
  SWIPE_THRESHOLD_RATIO: 0.16,
} as const;

const CAROUSEL_DRAG_SPEED_CONFIG_OVERRIDE: Partial<DragSpeedConfig> = {
  // Скорость начала fast-swipe ramp, >= 0.
  // Ниже порога жест использует базовую duration и базовую инерцию.
  velocityThreshold: 0.2,
  // Скорость полного насыщения fast-swipe ramp, >= velocityThreshold.
  // После этой точки усиление больше не растет.
  rampEnd: 1.35,
  // Минимальная доля от baseDuration для быстрого жеста (0..1).
  // Меньше значение -> быстрый жест может завершаться заметно короче.
  minDurationRatio: 0.14,
  // Абсолютный нижний предел gesture-duration (мс), > 0.
  // Не дает быстрым жестам стать слишком короткими.
  minDuration: 220,
  // Максимальное усиление release-инерции, >= 0.
  // 1 = без усиления, больше значение -> сильнее докат после быстрого жеста.
  inertiaBoost: 51,
  // Доля оставшегося release-пути для плавного разгона к gesture-speed (0..1).
  releaseAccelerationDistanceShare: 0.35,
  // Доля оставшегося release-пути для плавного торможения к target (0..1).
  releaseDecelerationDistanceShare: 0.65,
} as const;

export const CAROUSEL_DRAG_CONFIG: Required<DragConfig> = {
  ...DEFAULT_DRAG_CONFIG,
  ...CAROUSEL_DRAG_CONFIG_OVERRIDE,
};

export const CAROUSEL_DRAG_SPEED_CONFIG: DragSpeedConfig = {
  ...DEFAULT_DRAG_SPEED_CONFIG,
  ...CAROUSEL_DRAG_SPEED_CONFIG_OVERRIDE,
};
