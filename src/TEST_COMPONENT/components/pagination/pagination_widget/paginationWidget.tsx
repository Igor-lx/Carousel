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
  PaginationWidgetClassMap,
  DotWidgetState,
  ContainerCSSVars,
  DotCSSVars,
} from "./types";
import { useLayoutNotice, usePaginationEngine, useSpatialField } from "./hooks";

const Dot = memo(
  ({
    x,
    scale,
    opacity,
    isActive,
    className,
  }: DotWidgetState & { className: PaginationWidgetClassMap }) => {
    const style: DotCSSVars = {
      "--dot-x": `${x}px`,
      "--dot-scale": scale,
      "--dot-opacity": opacity,
    };

    return (
      <div
        className={clsx(className.dot_PW, isActive && className.dotActive_PW)}
        style={style}
      />
    );
  },
);

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

    const { getDotState, dotsPool, actualVisibleDots } = useSpatialField({
      visibleDots,
      config: spatialConfig,
      step: state.step,
    });

    const { action: handleMove } = usePaginationEngine(state, dispatch, {
      delay,
      duration,
    });

    useLayoutNotice({ visibleDots, actualVisibleDots });

    useImperativeHandle(
      ref,
      () => ({
        moveRight: () => handleMove("next"),
        moveLeft: () => handleMove("prev"),
      }),
      [handleMove],
    );

    const containerStyle = useMemo<ContainerCSSVars>(() => {
      const isAnimating = state.mode === "MOVING" && !isFreezed;
      return {
        "--duration": `${isAnimating ? state.activeDuration : 0}ms`,
        "--delay": `${state.mode === "WAITING" ? state.activeDelay : 0}ms`,
        "--visible-dots-count": actualVisibleDots,
        "--dot-size": `${dotSize}px`,
        "--dots-gap": `${dotGap}px`,
      };
    }, [
      state.mode,
      state.activeDuration,
      state.activeDelay,
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
        {dotsPool.map((id) => (
          <Dot key={id} {...getDotState(id)} className={className} />
        ))}
      </div>
    );
  }),
);
