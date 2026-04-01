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
  ContainerCSSVars,
  DotCSSVars,
} from "./types";
import { useLayoutNotice, usePaginationEngine, useSpatialField } from "./hooks";

// Оптимизированный Dot: принимает примитивы для стабильности memo
const Dot = memo(
  ({
    id,
    getDotState,
    className,
  }: {
    id: number;
    getDotState: (id: number) => any;
    className: PaginationWidgetClassMap;
  }) => {
    const { x, scale, opacity, isActive } = getDotState(id);

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
  (prev, next) => {
    // Кастомное сравнение: Dot ререндерится только если изменилась функция получения состояния
    // (которая зависит от step) или id.
    return prev.id === next.id && prev.getDotState === next.getDotState;
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

    const { action: handleMove, activeDuration } = usePaginationEngine(
      state,
      dispatch,
      {
        delay,
        duration,
      },
    );

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
        {dotsPool.map((id) => (
          <Dot
            key={id}
            id={id}
            getDotState={getDotState}
            className={className}
          />
        ))}
      </div>
    );
  }),
);
