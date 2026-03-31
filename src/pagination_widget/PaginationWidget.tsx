import {
  memo,
  useRef,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useState,
  useReducer,
} from "react";
import clsx from "clsx";
import { WIDGET_DEFAULTS } from "./const";
import { useDimensions } from "./useDimensions";
import { usePaginationEngine } from "./usePaginationEngine";
import { useSpatialField } from "./useSpatialField";
import { paginationReducer, initialState } from "./reducer";
import type {
  PaginationWidgetProps,
  PaginationWidgetHandler,
  PaginationWidgetDotProps,
  DotWidgetStyle,
  ContainerWidgetStyle,
} from "./types";
import { useLayoutNotice } from "./useLayoutNotice";




const Dot = memo(({ state, className }: PaginationWidgetDotProps) => {
  const style: DotWidgetStyle = {
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
    const { getDotState, dotsPool, actualVisibleDots } = useSpatialField({
      visibleDots,
      config: { ...dims, scaleFactor },
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

    useImperativeHandle(ref, () => ({
      moveRight: () => handleMove("next"),
      moveLeft: () => handleMove("prev"),
    }));

    // Добавляем типизацию для кастомных свойств
    const containerStyle = {
      "--duration": `${!isMounted || isFreezed ? 0 : state.activeDuration}ms`,
      "--delay": `${!isMounted || isFreezed ? 0 : state.activeDelay}ms`,
      "--visible-dots-count": actualVisibleDots,
    } as ContainerWidgetStyle & Record<string, number | string>;

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
