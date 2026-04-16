import { memo, useMemo, useReducer, useRef } from "react";

import styles from "./Carousel.module.scss";
import controlsVariables from "./styles/Controls.variables.module.scss";
import paginationVariables from "./styles/Pagination.variables.module.scss";

import {
  useCarouselAutoPlay,
  useCarouselClick,
  useCarouselController,
  useCarouselContextValue,
  useCarouselEngine,
  useCarouselGesture,
  useCarouselMotion,
  useCarouselSlides,
  useCarouselSpeed,
  useCarouselTechStyles,
  usePerfectLayoutNotice,
} from "./hooks";

import {
  manageFocusShift,
  mergeStyles,
  resolveSlots,
  useComponentVisibility,
  useExternalRefBridge,
  useIsomorphicLayoutEffect,
  useIsReducedMotion,
  useIsTouchDevice,
  usePickStyles,
} from "../shared";

import { SlideItem } from "./components";
import {
  getAnimStatus,
  initialState,
  reconcileStateToLayout,
  reducer,
} from "./model/reducer";
import {
  CAROUSEL_SLOTS,
  DEFAULT_SETTINGS,
  VISIBILITY_THRESHOLD,
} from "./model/config";
import { CarouselContext } from "./model/context";
import {
  type CarouselExternalController,
  useCarouselExternalControllerSync,
} from "./control";
import { SLIDE_KEYS, type CarouselProps } from "./Carousel.types";
import {
  clampSlidesData,
  getCarouselLayout,
  hasImperfectLayout,
  resolveSafeSettings,
  resolveSlidesData,
  type CarouselLayout,
} from "./utilities";

const INTERNAL_CLASS_NAMES = mergeStyles(
  styles,
  controlsVariables,
  paginationVariables,
);

const Carousel = memo((props: CarouselProps) => {
  const {
    slidesData = [],
    visibleSlidesNr = DEFAULT_SETTINGS.visibleSlidesNr,
    isLayoutClamped = DEFAULT_SETTINGS.isLayoutClamped,
    durationAutoplay = DEFAULT_SETTINGS.durationAutoplay,
    intervalAutoplay = DEFAULT_SETTINGS.intervalAutoplay,
    durationStep = DEFAULT_SETTINGS.durationStep,
    durationJump = DEFAULT_SETTINGS.durationJump,
    isContentImg = DEFAULT_SETTINGS.isContentImg,
    errAltPlaceholder = DEFAULT_SETTINGS.errAltPlaceholder,
    isAuto = DEFAULT_SETTINGS.isAuto,
    isPaginationOn = DEFAULT_SETTINGS.isPaginationOn,
    isInteractive = DEFAULT_SETTINGS.isInteractive,
    isFinite = DEFAULT_SETTINGS.isFinite,
    isControlsOn = DEFAULT_SETTINGS.isControlsOn,
    className,
    isInstantMotion,
    isTouchDevice,
    onSlideClick,
    children,
  } = props;

  const totalSlides = slidesData.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const movingRef = useRef<HTMLDivElement>(null);
  const motionPositionRef = useRef(0);

  const isReducedMotion = isInstantMotion ?? useIsReducedMotion();
  const isTouch = isTouchDevice ?? useIsTouchDevice();
  const { visible: isVisible } = useComponentVisibility({
    elementRef: containerRef,
    threshold: VISIBILITY_THRESHOLD,
  });

  const {
    visibleSlidesCount,
    autoplayDuration,
    stepDuration,
    jumpDuration,
    autoplayInterval,
    errorAltPlaceholder,
  } = resolveSafeSettings({
    visibleSlidesNr,
    durationAutoplay,
    durationStep,
    durationJump,
    intervalAutoplay,
    errAltPlaceholder,
  });

  const { instanceRef: externalControllerRef, connectedChildren } =
    useExternalRefBridge<CarouselExternalController>(children);

  const hasLayoutMismatch = hasImperfectLayout(totalSlides, visibleSlidesCount);
  const shouldClampLayout = isLayoutClamped && hasLayoutMismatch;

  const resolvedSlidesData = useMemo(
    () => resolveSlidesData(slidesData),
    [slidesData],
  );

  const layoutSlidesData = useMemo(
    () =>
      shouldClampLayout
        ? clampSlidesData(resolvedSlidesData, visibleSlidesCount)
        : resolvedSlidesData,
    [resolvedSlidesData, shouldClampLayout, visibleSlidesCount],
  );

  const nextLayout = useMemo<CarouselLayout>(
    () => getCarouselLayout(layoutSlidesData, visibleSlidesCount, isFinite),
    [layoutSlidesData, visibleSlidesCount, isFinite],
  );

  const [state, baseDispatch] = useReducer(reducer, nextLayout, initialState);

  const syncedState = useMemo(
    () => reconcileStateToLayout(state, nextLayout),
    [state, nextLayout],
  );

  const {
    targetIndex,
    virtualIndex,
    fromVirtualIndex,
    followUpVirtualIndex,
    isRepeatedClickAdvance,
    animMode,
    moveReason,
  } = syncedState;

  const { canSlide, pageCount, clampedVisible } = nextLayout;

  usePerfectLayoutNotice({
    hasImperfectLayout: hasLayoutMismatch,
    originalLength: totalSlides,
    normalizedLength: layoutSlidesData.length,
    visibleSlidesNr: clampedVisible,
    isLayoutClamped: shouldClampLayout,
  });

  const { isMoving, isJumping, isInstant, isIdle } = useMemo(
    () => getAnimStatus(animMode),
    [animMode],
  );

  const {
    slides: virtualSlides,
    isAtStart,
    isAtEnd,
    windowStart,
  } = useCarouselSlides({
    current: virtualIndex,
    prev: fromVirtualIndex,
    isMoving,
    targetIndex,
    layout: nextLayout,
    slidesData: layoutSlidesData,
  });

  const { dispatchAction, finalizeStep: finalizeEngineStep } =
    useCarouselEngine({
      dispatch: baseDispatch,
      isInstantMode: isReducedMotion,
      isMoving,
      layout: nextLayout,
    });

  const {
    move,
    goTo,
    startDrag,
    snapDrag,
  } = useCarouselController({
    dispatchAction,
    enabled: canSlide,
    externalController: externalControllerRef,
    measureRef: containerRef,
    layout: nextLayout,
    baseVirtualIndex: virtualIndex,
    currentPositionRef: motionPositionRef,
  });

  const {
    isDragging,
    velocity,
    dragListeners,
    offset,
  } = useCarouselGesture({
    onDragStart: startDrag,
    onDragSnap: snapDrag,
    onMove: move,
    enabled: canSlide,
    measureRef: containerRef,
  });

  const {
    handlePrev,
    handleNext,
    handlePageSelect,
    handleSlideClick,
  } = useCarouselClick({
    onMove: move,
    onGoTo: goTo,
    onClick: onSlideClick,
  });

  const isPaused = !isVisible || isDragging || isMoving;
  const { onHover } = useCarouselAutoPlay({
    enabled: isAuto && canSlide,
    ignoreHover: isTouch,
    autoplayInterval,
    isPaused,
    isAtEnd,
    onGoTo: goTo,
    onMove: move,
  });

  const actualDuration = useCarouselSpeed({
    velocity,
    reason: moveReason,
    animMode,
    isDragging,
    isInstant,
    isRepeatedClickAdvance,
    segmentStartVirtualIndex: fromVirtualIndex,
    targetVirtualIndex: virtualIndex,
    stepSize: clampedVisible,
    autoplayDuration,
    stepDuration,
    jumpDuration,
  });

  const followUpDuration = useMemo(() => {
    if (followUpVirtualIndex === null || clampedVisible <= 0) {
      return 0;
    }

    const stepSpan = Math.abs(followUpVirtualIndex - virtualIndex) / clampedVisible;

    return stepDuration * Math.max(0, stepSpan);
  }, [clampedVisible, followUpVirtualIndex, stepDuration, virtualIndex]);

  useCarouselMotion({
    trackRef: movingRef,
    currentPositionRef: motionPositionRef,
    enabled: canSlide,
    startVirtualIndex: fromVirtualIndex,
    currentVirtualIndex: virtualIndex,
    windowStart,
    size: clampedVisible,
    isMoving,
    animMode,
    reason: moveReason,
    duration: actualDuration,
    isRepeatedClickAdvance,
    followUpVirtualIndex,
    followUpDuration,
    onComplete: finalizeEngineStep,
  });

  useCarouselExternalControllerSync({
    externalControllerRef,
    isReducedMotion,
    actualDuration,
  });

  const slots = useMemo(
    () => resolveSlots(connectedChildren, CAROUSEL_SLOTS),
    [connectedChildren],
  );

  const {
    trackStyle,
    slideStyle,
  } = useCarouselTechStyles({
    current: virtualIndex,
    windowStart,
    size: clampedVisible,
    isDragging,
    dragOffset: offset,
  });

  useIsomorphicLayoutEffect(() => {
    if (isIdle) {
      manageFocusShift(containerRef.current);
    }
  }, [isIdle, targetIndex]);

  const contextValue = useCarouselContextValue({
    pageCount,
    activePageIndex: targetIndex,
    isMoving,
    isJumping,
    moveReason,
    actualDuration,
    handlePageSelect,
    handlePrev,
    handleNext,
    isAtStart,
    isAtEnd,
    isTouch,
    isReducedMotion,
  });

  const classNames = useMemo(
    () =>
      className
        ? mergeStyles(INTERNAL_CLASS_NAMES, className)
        : INTERNAL_CLASS_NAMES,
    [className],
  );

  const slideClassNames = usePickStyles(classNames, SLIDE_KEYS);

  if (totalSlides === 0) return null;

  return (
    <CarouselContext.Provider value={contextValue}>
      <div
        className={classNames.outerContainer}
        role="region"
        aria-roledescription="carousel"
        data-touch={isTouch}
        data-reduced-motion={isReducedMotion}
      >
        <div
          ref={containerRef}
          tabIndex={-1}
          className={classNames.innerContainer}
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
          {...dragListeners}
        >
          <div
            ref={movingRef}
            className={classNames.slideContainer}
            style={trackStyle}
          >
            {virtualSlides.map((slide) => {
              return (
                <SlideItem
                  key={slide.slideKey}
                  slideData={slide.slideData}
                  className={slideClassNames}
                  style={slideStyle}
                  isContentImg={isContentImg}
                  errAltPlaceholder={errorAltPlaceholder}
                  onSlideClick={handleSlideClick}
                  isInteractive={isInteractive}
                  isActive={slide.isActive}
                  isActual={slide.isActual}
                  {...slide.a11yProps}
                />
              );
            })}
          </div>
          {isControlsOn && canSlide && slots.controls}
        </div>
        {isPaginationOn && slots.pagination}
      </div>
    </CarouselContext.Provider>
  );
});

export default Carousel;
