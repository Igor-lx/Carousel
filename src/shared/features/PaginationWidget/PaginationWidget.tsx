import {
  memo,
  useImperativeHandle,
  forwardRef,
  useReducer,
  useMemo,
} from "react";
import clsx from "clsx";
import { WIDGET_DEFAULTS } from "./model/constants";
import styles from "./PaginationWidget.module.scss";

import type {
  PaginationWidgetProps,
  PaginationWidgetHandler,
  ContainerCSSVars,
  DotCSSVars,
  DotProps,
} from "./model/types";
import { usePaginationEngine } from "./hooks/usePaginationEngine";
import { useSpatialField } from "./hooks/useSpatialField";
import { initialState, paginationReducer } from "./model/reducer";
import { mergeStyles } from "../../../shared";

export const PaginationWidget = memo(
  forwardRef<PaginationWidgetHandler, PaginationWidgetProps>((props, ref) => {
    const {
      visibleDots = WIDGET_DEFAULTS.visibleDots,
      dotSize = WIDGET_DEFAULTS.dotSize,
      dotGap = WIDGET_DEFAULTS.dotGap,
      isFreezed = WIDGET_DEFAULTS.isFreezed,
      delay = WIDGET_DEFAULTS.delay,
      duration = WIDGET_DEFAULTS.duration,
      scaleFactor = WIDGET_DEFAULTS.scaleFactor,
      className,
    } = props;

    const mergedStyles = useMemo(
      () => mergeStyles(styles, className),
      [className],
    );

    const [state, dispatch] = useReducer(paginationReducer, initialState);

    const spatialConfig = useMemo(
      () => ({
        size: dotSize,
        gap: dotGap,
        scaleFactor,
      }),
      [dotSize, dotGap, scaleFactor],
    );

    const { dotsData, actualVisibleDots } = useSpatialField({
      visibleDots,
      config: spatialConfig,
      step: state.step,
    });

    const { action, activeDuration } = usePaginationEngine(state, dispatch, {
      delay,
      duration,
    });

    useImperativeHandle(
      ref,
      () => ({
        moveRight: () => action("next"),
        moveLeft: () => action("prev"),
      }),
      [action],
    );

    const containerStyle = useMemo<ContainerCSSVars>(() => {
      const isAnimating = state.mode === "MOVING" && !isFreezed;
      return {
        "--duration": `${isAnimating ? activeDuration : 0}ms`,
        "--delay": `${state.mode === "WAITING" ? delay : 0}ms`,
        "--visible-dots-count": String(actualVisibleDots),
        "--dot-size": `${dotSize}px`,
        "--dots-gap": `${dotGap}px`,
      };
    }, [
      state.mode,
      activeDuration,
      delay,
      actualVisibleDots,
      dotSize,
      dotGap,
      isFreezed,
    ]);

    return (
      <div
        className={clsx(
          mergedStyles.container_PW,
          isFreezed && mergedStyles.freezed,
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

const Dot = memo(({ state, className }: DotProps) => {
  const style: DotCSSVars = {
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
