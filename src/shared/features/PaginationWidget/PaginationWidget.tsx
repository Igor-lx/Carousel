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
        size: dotSize,
        gap: dotGap,
        scaleFactor,
      }),
      [dotSize, dotGap, scaleFactor],
    );

    const { dotsData, actualVisibleDots } = usePaginationWidgetSpatialField({
      visibleDots,
      config: widgetSpatialConfig,
      step: widgetState.step,
    });

    usePaginationWidgetLayoutNotice({
      visibleDots,
      actualVisibleDots,
    });

    const { rotateWidget, activeDuration, setDuration } =
      usePaginationWidgetEngine(widgetState, dispatchWidgetAction, {
        delay,
        duration,
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
        "--delay": `${widgetState.mode === "WAITING" ? delay : 0}ms`,
        "--visible-dots-count": String(actualVisibleDots),
        "--dot-size": `${dotSize}px`,
        "--dots-gap": `${dotGap}px`,
      };
    }, [
      widgetState.mode,
      activeDuration,
      delay,
      actualVisibleDots,
      dotSize,
      dotGap,
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
