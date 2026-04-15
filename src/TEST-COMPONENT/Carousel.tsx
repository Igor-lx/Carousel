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
  useCarouselOrchestration,
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
import { VISIBILITY_THRESHOLD, CAROUSEL_SLOTS } from "./model/constants";
import { DEFAULT_SETTINGS } from "./model/defaultSettings";
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

  const isReducedMotion = isInstantMotion ?? useIsReducedMotion();
  const isTouch = isTouchDevice ?? useIsTouchDevice();
  const { visible: isVisible } = useComponentVisibility({
    elementRef: containerRef,
    threshold: VISIBILITY_THRESHOLD,
  });

  const {
    autoplayDuration,
    stepDuration,
    jumpDuration,
    autoplayInterval,
    errorAltPlaceholder,
  } = resolveSafeSettings({
    durationAutoplay,
    durationStep,
    durationJump,
    intervalAutoplay,
    errAltPlaceholder,
  });

  const { instanceRef: externalControllerRef, connectedChildren } =
    useExternalRefBridge<CarouselExternalController>(children);

  const hasLayoutMismatch = hasImperfectLayout(totalSlides, visibleSlidesNr);
  const shouldClampLayout = isLayoutClamped && hasLayoutMismatch;

  const resolvedSlidesData = useMemo(
    () => resolveSlidesData(slidesData),
    [slidesData],
  );

  const layoutSlidesData = useMemo(
    () =>
      shouldClampLayout
        ? clampSlidesData(resolvedSlidesData, visibleSlidesNr)
        : resolvedSlidesData,
    [resolvedSlidesData, shouldClampLayout, visibleSlidesNr],
  );

  const nextLayout = useMemo<CarouselLayout>(
    () => getCarouselLayout(layoutSlidesData, visibleSlidesNr, isFinite),
    [layoutSlidesData, visibleSlidesNr, isFinite],
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
    animMode,
    moveReason,
    pendingTransition,
  } = syncedState;

  const { canSlide, pageCount, clampedVisible } = nextLayout;

  usePerfectLayoutNotice({
    hasImperfectLayout: hasLayoutMismatch,
    originalLength: totalSlides,
    normalizedLength: layoutSlidesData.length,
    visibleSlidesNr: clampedVisible,
    isLayoutClamped: shouldClampLayout,
  });

  const { isMoving, isAnimating, isJumping, isInstant, isIdle } = useMemo(
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
    renderTarget: pendingTransition?.virtualIndex ?? virtualIndex,
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
    finalizeStep,
    activeStepDuration,
  } = useCarouselController({
    dispatchAction,
    finalizeStep: finalizeEngineStep,
    enabled: canSlide,
    externalController: externalControllerRef,
    isMoving,
    stepDuration,
    measureRef: containerRef,
    movingRef,
    layout: nextLayout,
    state: syncedState,
    windowStart,
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
    isInteractive: isDragging,
    isInstant,
    viewportRef: containerRef,
    autoplayDuration,
    stepDuration: activeStepDuration,
    jumpDuration,
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

  const { handleTransitionEnd } = useCarouselOrchestration({
    pendingTransition,
    dispatchAction,
    finalizeStep,
    isInstant,
    isReducedMotion,
    isAnimating,
    actualDuration,
  });

  const {
    trackStyle,
    slideStyle,
  } = useCarouselTechStyles({
    current: virtualIndex,
    windowStart,
    size: clampedVisible,
    animMode,
    isInteractive: isDragging,
    duration: actualDuration,
    enabled: canSlide,
    reason: moveReason,
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
            onTransitionEnd={handleTransitionEnd}
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
