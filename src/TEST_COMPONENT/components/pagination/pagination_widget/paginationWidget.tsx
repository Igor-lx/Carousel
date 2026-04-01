import {
  memo,
  useImperativeHandle,
  forwardRef,
  useReducer,
  useMemo,
} from "react";
import clsx from "clsx";
import { WIDGET_DEFAULTS } from "./const";
import { paginationReducer, initialState } from "./reducer";
import type {
  PaginationWidgetProps,
  PaginationWidgetHandler,
  ContainerCSSVars,
  DotCSSVars,
  DotProps,
} from "./types";
import { usePaginationEngine } from "./hooks/usePaginationEngine";
import { useSpatialField } from "./hooks/useSpatialField";

/**
 * Пропсы для точки: данные состояния отделены от оформления
 */

const Dot = memo(({ state, className }: DotProps) => {
  const style: DotCSSVars = {
    "--dot-x": `${state.x}px`,
    "--dot-scale": state.scale,
    "--dot-opacity": state.opacity,
  };

  return (
    <div
      className={clsx(
        className.dot_PW,
        state.isActive && className.dotActive_PW,
      )}
      style={style}
    />
  );
});

Dot.displayName = "PaginationWidget.Dot";

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
        className={clsx(className.container_PW, isFreezed && className.freezed)}
        style={containerStyle}
      >
        {dotsData.map((dot) => (
          <Dot key={dot.id} state={dot} className={className} />
        ))}
      </div>
    );
  }),
);
