import {
  memo,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useState,
  useReducer,
  useMemo,
} from "react";
import clsx from "clsx";
import { WIDGET_DEFAULTS } from "./const";

import { paginationReducer, initialState } from "./reducer";
import type {
  PaginationWidgetProps,
  PaginationWidgetHandler,
  DotWidgetState,
  PaginationWidgetClassMap,
  ContainerCSSVars,
  DotCSSVars,
} from "./types";
import { useDimensions, useLayoutNotice, usePaginationEngine, useSpatialField } from "./hooks";

const Dot = memo(
  ({
    state,
    className,
  }: {
    state: DotWidgetState;
    className: PaginationWidgetClassMap;
  }) => {
    const style = useMemo<DotCSSVars>(
      () => ({
        "--dot-x": `${state.x}px`,
        "--dot-scale": state.scale,
        "--dot-opacity": state.opacity,
      }),
      [state.x, state.scale, state.opacity],
    );

    return (
      <div
        className={clsx(
          className.dot_PW,
          state.isActive && className.dotActive_PW,
        )}
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
      isFreezed = WIDGET_DEFAULTS.isFreezed,
      delay = WIDGET_DEFAULTS.delay,
      duration = WIDGET_DEFAULTS.duration,
      scaleFactor = WIDGET_DEFAULTS.scaleFactor,
      className,
    } = props;

    const [isMounted, setIsMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [state, dispatch] = useReducer(paginationReducer, initialState);

    const dims = useDimensions(containerRef);
    const spatialConfig = useMemo(
      () => ({ ...dims, scaleFactor }),
      [dims, scaleFactor],
    );

    const { getDotState, dotsPool, actualVisibleDots } = useSpatialField({
      visibleDots,
      config: spatialConfig,
      step: state.step,
    });

    const { action: handleMove } = usePaginationEngine({
      dispatch,
      mode: state.animMode,
      step: state.step,
      duration: state.activeDuration,
      configDelay: delay,
      configDuration: duration,
    });

    useLayoutNotice({ visibleDots, actualVisibleDots });

    useEffect(() => {
      setIsMounted(true);
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        moveRight: () => handleMove("next"),
        moveLeft: () => handleMove("prev"),
      }),
      [handleMove],
    );

    const containerStyle = useMemo<ContainerCSSVars>(
      () => ({
        "--duration": `${!isMounted || isFreezed ? 0 : state.activeDuration}ms`,
        "--delay": `${!isMounted || isFreezed ? 0 : state.activeDelay}ms`,
        "--visible-dots-count": actualVisibleDots,
      }),
      [
        isMounted,
        isFreezed,
        state.activeDuration,
        state.activeDelay,
        actualVisibleDots,
      ],
    );

    return (
      <div
        ref={containerRef}
        className={clsx(
          className.container_PW,
          (isFreezed || !isMounted) && className.freezed,
        )}
        style={containerStyle}
      >
        {dotsPool.map((id) => (
          <Dot key={id} state={getDotState(id)} className={className} />
        ))}
      </div>
    );
  }),
);


