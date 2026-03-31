import { useMemo, useCallback } from "react";
import type { SpatialConfig, DotWidgetState } from "./types";
import { EDGE_DRIFT_FACTOR } from "./const";

export function useSpatialField({
  visibleDots,
  config,
  step,
}: {
  visibleDots: number;
  config: SpatialConfig;
  step: number;
}) {
  // 1. ГАРАНТИРУЕМ ЧИСЛО. Если прилетело что-то странное, берем 3.
  const dotsCount = Number(visibleDots) || 3;

  const { actualCount, centerIndex } = useMemo(() => {
    const actual = dotsCount % 2 === 0 ? dotsCount + 1 : dotsCount;
    return { actualCount: actual, centerIndex: Math.floor(actual / 2) };
  }, [dotsCount]);

  // 2. ГРАНИЦЫ ВИДИМОСТИ
  const getScale = useCallback(
    (dist: number) => {
      const abs = Math.abs(dist);
      // Если abs > centerIndex + 0.5, точка получает scale 0.
      // При centerIndex = 1 (visibleDots: 3) -> видно 3 точки.
      // При centerIndex = 2 (visibleDots: 5) -> видно 5 точек.
      // При centerIndex = 4 (visibleDots: 9) -> видно 9 точек.
      if (abs > centerIndex + 0.5) return 0;
      return Math.pow(config.scaleFactor, abs);
    },
    [centerIndex, config.scaleFactor],
  );

  // 3. КООРДИНАТЫ (strip)
  const strip = useMemo(() => {
    const res = new Array(actualCount).fill(0);
    if (config.size === 0) return res;

    for (let i = centerIndex + 1; i < actualCount; i++) {
      const d =
        config.gap +
        (config.size *
          (getScale(i - 1 - centerIndex) + getScale(i - centerIndex))) /
          2;
      res[i] = res[i - 1] + d;
    }
    for (let i = centerIndex - 1; i >= 0; i--) {
      const d =
        config.gap +
        (config.size *
          (getScale(i + 1 - centerIndex) + getScale(i - centerIndex))) /
          2;
      res[i] = res[i + 1] - d;
    }
    return res;
  }, [actualCount, centerIndex, config, getScale]);

  const getDotState = useCallback(
    (id: number): DotWidgetState => {
      const dist = id - step;
      const absDist = Math.abs(dist);
      const slot = dist + centerIndex;
      const unit = config.size + config.gap;
      let x: number;

      // 1. Расчет координат (оставляем без изменений)
      if (slot < 0) {
        const offset = (1 - Math.exp(slot)) * (unit * EDGE_DRIFT_FACTOR);
        x = strip[0] - offset;
      } else if (slot > actualCount - 1) {
        const overSlot = slot - (actualCount - 1);
        const offset = (1 - Math.exp(-overSlot)) * (unit * EDGE_DRIFT_FACTOR);
        x = strip[actualCount - 1] + offset;
      } else {
        const f = Math.floor(slot),
          c = Math.ceil(slot),
          t = slot - f;
        const xF = strip[f];
        const xC = strip[c] ?? xF + unit;
        x = xF + (xC - xF) * t;
      }

      const scale = getScale(dist);

      // 2. ИСПРАВЛЕННАЯ ЛОГИКА OPACITY
      // Граница, после которой точка ДОЛЖНА быть полностью невидимой
      const opacityLimit = centerIndex + 0.5;

      // Точка начинает затухать, как только absDist превышает centerIndex - 0.5
      // То есть за полшага до "вылета" из видимого пула
      const fadeStart = centerIndex - 0.5;
      const fadeRange = opacityLimit - fadeStart; // обычно это ровно 1.0

      let finalOpacity = 1;

      if (absDist > fadeStart) {
        // Рассчитываем затухание от 1 до 0
        finalOpacity = Math.max(0, 1 - (absDist - fadeStart) / fadeRange);
      }

      return {
        id,
        x,
        scale,
        opacity: finalOpacity,
        isActive: Math.abs(dist) < 0.1,
      };
    },
    [step, centerIndex, strip, config, getScale, actualCount],
  );

  // 4. ПУЛ (Увеличиваем его до максимума)
  const dotsPool = useMemo(() => {
    // Рисуем с запасом, чтобы видеть, где они обрезаются
    const side = Math.max(actualCount, 10);
    const range = [];
    for (let i = step - side; i <= step + side; i++) {
      range.push(i);
    }
    return range;
  }, [step, actualCount]);

  return { getDotState, dotsPool, actualVisibleDots: actualCount };
}
