import {
  memo,
  useImperativeHandle,
  forwardRef,
  useReducer,
  useMemo,
} from "react";
import clsx from "clsx";
import { PAGINATION_WIDGET_DEFAULTS } from "./model/paginationWidgetConstants";
import styles from "./PaginationWidget.module.scss";

import type {
  PaginationWidgetContainerCSSVars,
  PaginationWidgetDotCSSVars,
  PaginationWidgetDotProps,
  PaginationWidgetProps,
  PaginationWidgetHandler,
} from "./model/paginationWidgetTypes";

import {
  initialPaginationWidgetState,
  paginationWidgetReducer,
} from "./model/paginationWidgetReducer";
import { mergeStyles } from "../../../shared";
import {
  usePaginationWidgetEngine,
  usePaginationWidgetLayoutNotice,
  usePaginationWidgetSpatialField,
} from "./hooks";

const normalizeFiniteNumber = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;

const normalizePositiveNumber = (
  value: number,
  fallback: number,
  min = 1,
) => {
  const safeValue = normalizeFiniteNumber(value, fallback);

  return safeValue >= min ? safeValue : fallback;
};

const normalizeNonNegativeNumber = (value: number, fallback: number) => {
  const safeValue = normalizeFiniteNumber(value, fallback);

  return safeValue >= 0 ? safeValue : fallback;
};

const normalizeVisibleDotsCount = (value: number, fallback: number) => {
  const safeValue = normalizeFiniteNumber(value, fallback);
  const integerValue = Math.max(Math.floor(safeValue), 3);

  return integerValue % 2 === 0 ? integerValue + 1 : integerValue;
};

export const PaginationWidget = memo(
  forwardRef<PaginationWidgetHandler, PaginationWidgetProps>((props, ref) => {
    const {
      visibleDots = PAGINATION_WIDGET_DEFAULTS.visibleDots,
      dotSize = PAGINATION_WIDGET_DEFAULTS.dotSize,
      dotGap = PAGINATION_WIDGET_DEFAULTS.dotGap,
      delay = PAGINATION_WIDGET_DEFAULTS.delay,
      duration = PAGINATION_WIDGET_DEFAULTS.duration,
      scaleFactor = PAGINATION_WIDGET_DEFAULTS.scaleFactor,
      className,
    } = props;
    const normalizedVisibleDots = normalizeVisibleDotsCount(
      visibleDots,
      PAGINATION_WIDGET_DEFAULTS.visibleDots,
    );
    const normalizedDotSize = normalizePositiveNumber(
      dotSize,
      PAGINATION_WIDGET_DEFAULTS.dotSize,
    );
    const normalizedDotGap = normalizeNonNegativeNumber(
      dotGap,
      PAGINATION_WIDGET_DEFAULTS.dotGap,
    );
    const normalizedDelay = normalizeNonNegativeNumber(
      delay,
      PAGINATION_WIDGET_DEFAULTS.delay,
    );
    const normalizedDuration = normalizePositiveNumber(
      duration,
      PAGINATION_WIDGET_DEFAULTS.duration,
    );
    const normalizedScaleFactor = normalizePositiveNumber(
      scaleFactor,
      PAGINATION_WIDGET_DEFAULTS.scaleFactor,
      0.01,
    );

    const [localIsFreezed, setLocalIsFreezed] = useReducer(
      (_: boolean, next: boolean) => next,
      PAGINATION_WIDGET_DEFAULTS.isFreezed,
    );

    const mergedStyles = useMemo(
      () => mergeStyles(styles, className),
      [className],
    );

    const [widgetState, dispatchWidgetAction] = useReducer(
      paginationWidgetReducer,
      initialPaginationWidgetState,
    );

    const widgetSpatialConfig = useMemo(
      () => ({
        size: normalizedDotSize,
        gap: normalizedDotGap,
        scaleFactor: normalizedScaleFactor,
      }),
      [normalizedDotGap, normalizedDotSize, normalizedScaleFactor],
    );

    const { dotsData, actualVisibleDots } = usePaginationWidgetSpatialField({
      visibleDots: normalizedVisibleDots,
      config: widgetSpatialConfig,
      step: widgetState.step,
    });

    usePaginationWidgetLayoutNotice({
      requestedVisibleDots: visibleDots,
      normalizedVisibleDots: actualVisibleDots,
    });

    const { rotateWidget, activeDuration, setDuration } =
      usePaginationWidgetEngine(widgetState, dispatchWidgetAction, {
        delay: normalizedDelay,
        duration: normalizedDuration,
        isFreezed: localIsFreezed,
      });

    useImperativeHandle(
      ref,
      () => ({
        moveRight: () => rotateWidget("next"),
        moveLeft: () => rotateWidget("prev"),
        toggleFreezed: (val: boolean) => setLocalIsFreezed(val),
        setDuration,
      }),
      [rotateWidget, setDuration],
    );

    const containerStyle = useMemo<PaginationWidgetContainerCSSVars>(() => {
      const isAnimating =
        widgetState.mode === "MOVING" && !localIsFreezed;
      return {
        "--duration": `${isAnimating ? activeDuration : 0}ms`,
        "--delay": `${widgetState.mode === "WAITING" ? normalizedDelay : 0}ms`,
        "--visible-dots-count": String(actualVisibleDots),
        "--dot-size": `${normalizedDotSize}px`,
        "--dots-gap": `${normalizedDotGap}px`,
      };
    }, [
      widgetState.mode,
      activeDuration,
      normalizedDelay,
      actualVisibleDots,
      normalizedDotSize,
      normalizedDotGap,
      localIsFreezed,
    ]);

    return (
      <div
        className={clsx(
          mergedStyles.container_PW,
          localIsFreezed && mergedStyles.freezed,
        )}
        style={containerStyle}
      >
        {dotsData.map((dot) => (
          <Dot key={dot.id} state={dot} className={mergedStyles} />
        ))}
      </div>
    );
  }),
);

const Dot = memo(({ state, className }: PaginationWidgetDotProps) => {
  const style: PaginationWidgetDotCSSVars = {
    "--dot-x": `${state.x}px`,
    "--dot-scale": state.scale,
    "--dot-opacity": state.opacity,
  };

  return (
    <div
      className={clsx(
        className?.dot_PW,
        state.isActive && className?.dotActive_PW,
      )}
      style={style}
    />
  );
});
