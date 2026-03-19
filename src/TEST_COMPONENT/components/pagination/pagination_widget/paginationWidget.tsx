import {
  memo,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from "react";
import clsx from "clsx";
import type {
  PaginationWidgetProps,
  PaginationWidgetHandler,
  PaginationWidgetDotProps,
  PaginationWidgetConfig,
  DotWidgetStyle,
} from "./types";
import { useVisualPagination } from "./usePaginationWidget";
import { useIsomorphicLayoutEffect } from "../../../hooks";

const Dot = memo(({ state, className }: PaginationWidgetDotProps) => {
  const style: DotWidgetStyle = {
    "--dot-x": `${state.x}px`,
    "--dot-scale": state.scale,
    "--dot-opacity": state.opacity,
  };

  return (
    <div
      className={clsx(
        className.dotPaginationWidget,
        state.isActive && className.dotPaginationWidgetActive,
      )}
      style={style}
    />
  );
});

export const PaginationWidget = memo(
  forwardRef<PaginationWidgetHandler, PaginationWidgetProps>(
    ({ visibleDots = 7, dotSize, gap, isFreezed = false, className }, ref) => {
      const containerRef = useRef<HTMLDivElement>(null);

      const [internalStep, setInternalStep] = useState(0);

      const [visualConfig, setVisualConfig] = useState<PaginationWidgetConfig>({
        size: dotSize ?? 20,
        gap: gap ?? 12,
      });

      useImperativeHandle(ref, () => ({
        moveRight: () => setInternalStep((s) => s + 1),
        moveLeft: () => setInternalStep((s) => s - 1),
      }));

      useIsomorphicLayoutEffect(() => {
        if (dotSize !== undefined && gap !== undefined) return;

        const container = containerRef.current;
        if (!container) return;

        const style = getComputedStyle(container);

        const cssSize = parseInt(style.getPropertyValue("--dot-size"), 10);
        const cssGap = parseInt(style.getPropertyValue("--dots-gap"), 10);

        setVisualConfig({
          size: dotSize ?? (Number.isNaN(cssSize) ? 20 : cssSize),
          gap: gap ?? (Number.isNaN(cssGap) ? 12 : cssGap),
        });
      }, [dotSize, gap]);

      const { getDotState, totalSlots } = useVisualPagination(
        visibleDots,
        visualConfig,
        internalStep,
      );

      const dotsPool = useMemo(
        () => Array.from({ length: totalSlots }, (_, i) => i),
        [totalSlots],
      );

      return (
        <div
          ref={containerRef}
          className={clsx(
            className.paginationWidgetContainer,
            isFreezed && className.paginationWidgetFreezed,
          )}
        >
          {dotsPool.map((id) => (
            <Dot key={id} state={getDotState(id)} className={className} />
          ))}
        </div>
      );
    },
  ),
);
