import {
  memo,
  useImperativeHandle,
  forwardRef,
  useReducer,
  useMemo,
  useCallback,
  useRef,
} from "react";
import clsx from "clsx";
import { PAGINATION_WIDGET_DEFAULTS } from "./model/paginationWidgetConstants";
import styles from "./PaginationWidget.module.scss";
import { normalizePaginationWidgetConfig } from "./model/paginationWidgetConfig";

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

    const {
      visibleDots: normalizedVisibleDots,
      spatial: widgetSpatialConfig,
      delay: normalizedDelay,
      duration: normalizedDuration,
    } = useMemo(
      () =>
        normalizePaginationWidgetConfig({
          visibleDots,
          dotSize,
          dotGap,
          delay,
          duration,
          scaleFactor,
        }),
      [delay, dotGap, dotSize, duration, scaleFactor, visibleDots],
    );

    const localIsStoppedRef = useRef<boolean>(
      PAGINATION_WIDGET_DEFAULTS.isStopped,
    );
    const [localIsStopped, setLocalIsStopped] = useReducer(
      (_: boolean, next: boolean) => next,
      PAGINATION_WIDGET_DEFAULTS.isStopped,
    );
    const updateLocalIsStopped = useCallback((nextIsStopped: boolean) => {
      const normalizedIsStopped = Boolean(nextIsStopped);

      localIsStoppedRef.current = normalizedIsStopped;
      setLocalIsStopped(normalizedIsStopped);
    }, []);

    const mergedStyles = useMemo(
      () => mergeStyles(styles, className),
      [className],
    );

    const [widgetState, dispatchWidgetAction] = useReducer(
      paginationWidgetReducer,
      initialPaginationWidgetState,
    );

    const { dotsData, actualVisibleDots } = usePaginationWidgetSpatialField({
      visibleDots: normalizedVisibleDots,
      config: widgetSpatialConfig,
      visualOffset: widgetState.visualOffset,
    });

    usePaginationWidgetLayoutNotice({
      requestedVisibleDots: visibleDots,
      normalizedVisibleDots: actualVisibleDots,
    });

    const { requestMovement, activeDuration, setDuration } =
      usePaginationWidgetEngine(widgetState, dispatchWidgetAction, {
        delay: normalizedDelay,
        duration: normalizedDuration,
        isStopped: localIsStopped,
        isStoppedRef: localIsStoppedRef,
      });

    useImperativeHandle(
      ref,
      () => ({
        moveRight: () => requestMovement("right"),
        moveLeft: () => requestMovement("left"),
        setStopped: updateLocalIsStopped,
        setDuration,
      }),
      [requestMovement, setDuration, updateLocalIsStopped],
    );

    const containerStyle = useMemo<PaginationWidgetContainerCSSVars>(() => {
      const isAnimating =
        widgetState.mode === "MOVING" && !localIsStopped;
      return {
        "--duration": `${isAnimating ? activeDuration : 0}ms`,
        "--visible-dots-count": String(actualVisibleDots),
        "--dot-size": `${widgetSpatialConfig.size}px`,
        "--dots-gap": `${widgetSpatialConfig.gap}px`,
      };
    }, [
      widgetState.mode,
      activeDuration,
      actualVisibleDots,
      widgetSpatialConfig.size,
      widgetSpatialConfig.gap,
      localIsStopped,
    ]);

    return (
      <div
        className={clsx(
          mergedStyles.container_PW,
          localIsStopped && mergedStyles.stopped,
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
