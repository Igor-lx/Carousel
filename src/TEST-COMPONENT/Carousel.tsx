import { useMemo, memo, useReducer, useRef } from "react";

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
  useSafeSettings,
} from "./hooks";

import {
  manageFocusShift,
  mergeStyles,
  useComponentVisibility,
  useIsomorphicLayoutEffect,
  useIsReducedMotion,
  useIsTouchDevice,
  resolveSlots,
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
  useCarouselExternalControllerSync,
  useExternalRefBridge,
} from "./control";
import { SLIDE_KEYS, type CarouselProps } from "./Carousel.types";
import {
  clampSlidesData,
  getCarouselLayout,
  hasImperfectLayout,
  resolveSlidesData,
  type CarouselLayout,
} from "./utilities";

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
    durationAutoplay: safeDurationAutoplay,
    durationStep: safeDurationStep,
    durationJump: safeDurationJump,
    intervalAutoplay: safeIntervalAutoplay,
    errAltPlaceholder: actualErrAltPlaceholder,
  } = useSafeSettings({
    durationAutoplay,
    durationStep,
    durationJump,
    intervalAutoplay,
    errAltPlaceholder,
  });

  const { externalRef: externalControllerRef, connectedChildren } =
    useExternalRefBridge(children);

  const needsLayoutClamp = hasImperfectLayout(totalSlides, visibleSlidesNr);
  const shouldClampLayout = isLayoutClamped && needsLayoutClamp;

  const baseResolvedSlidesData = useMemo(
    () => resolveSlidesData(slidesData),
    [slidesData],
  );

  const resolvedSlidesData = useMemo(
    () =>
      shouldClampLayout
        ? clampSlidesData(baseResolvedSlidesData, visibleSlidesNr)
        : baseResolvedSlidesData,
    [
      baseResolvedSlidesData,
      shouldClampLayout,
      shouldClampLayout ? visibleSlidesNr : null,
    ],
  );

  const nextLayout = useMemo<CarouselLayout>(
    () => getCarouselLayout(resolvedSlidesData, visibleSlidesNr, isFinite),
    [resolvedSlidesData, visibleSlidesNr, isFinite],
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
    hasImperfectLayout: needsLayoutClamp,
    originalLength: totalSlides,
    normalizedLength: resolvedSlidesData.length,
    visibleSlidesNr: clampedVisible,
    isLayoutClamped: shouldClampLayout,
  });

  const { isMoving, isAnimating, isJumping, isInstant, isIdle } = useMemo(
    () => getAnimStatus(animMode),
    [animMode],
  );

  const {
    data: virtualSlides,
    activeDot: activeDotIndex,
    isAtStart: isFiniteAndAtStart,
    isAtEnd: isFiniteAndAtEnd,
    windowStart,
  } = useCarouselSlides({
    current: virtualIndex,
    prev: fromVirtualIndex,
    renderTarget: pendingTransition?.virtualIndex ?? virtualIndex,
    isMoving: isAnimating,
    targetIndex,
    layout: nextLayout,
    slidesData: resolvedSlidesData,
  });

  const { dispatch: componentDispatch, finalize: componentFinalize } =
    useCarouselEngine({
      dispatch: baseDispatch,
      isInstantMode: isReducedMotion,
      isMoving,
      layout: nextLayout,
    });

  const {
    move: executeMove,
    goTo: executeGoTo,
    dragStart: executeDragStart,
    dragSnap: executeDragSnap,
    finalize: safeFinalizeMove,
    activeDuration,
  } = useCarouselController({
    dispatch: componentDispatch,
    finalize: componentFinalize,
    enabled: canSlide,
    externalController: externalControllerRef,
    isMoving,
    baseDuration: safeDurationStep,
    measureRef: containerRef,
    movingRef,
    layout: nextLayout,
    state: syncedState,
    windowStart,
  });

  const isGestureEnabled = canSlide;

  const {
    isDragging,
    velocity,
    dragListeners: bindDragListeners,
    offset,
  } = useCarouselGesture({
    onDragStart: executeDragStart,
    onDragSnap: executeDragSnap,
    onMove: executeMove,
    enabled: isGestureEnabled,
    measureRef: containerRef,
  });

  const {
    handlePrev: handleMovePrevClick,
    handleNext: handleMoveNextClick,
    handleDot: handleDotClick,
    handleSlide: handleSlideClick,
  } = useCarouselClick({
    onMove: executeMove,
    onGoTo: executeGoTo,
    onClick: onSlideClick,
  });

  const isPaused = !isVisible || isDragging || isMoving;
  const { onHover } = useCarouselAutoPlay({
    enabled: isAuto && canSlide,
    ignoreHover: isTouch,
    intervalAutoplay: safeIntervalAutoplay,
    isPaused: isPaused,
    isAtEnd: isFiniteAndAtEnd,
    onGoTo: executeGoTo,
    onMove: executeMove,
  });

  const actualDuration = useCarouselSpeed({
    velocity,
    reason: moveReason,
    animMode: animMode,
    isInteractive: isDragging,
    isInstant,
    viewportRef: containerRef,
    durationAutoplay: safeDurationAutoplay,
    durationStep: activeDuration,
    durationJump: safeDurationJump,
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
    dispatch: componentDispatch,
    finalize: safeFinalizeMove,
    isInstant,
    isReducedMotion,
    isAnimating,
    actualDuration,
  });

  const {
    containerStyle: containerTechStyle,
    itemStyle: slideWrapperTechStyle,
  } = useCarouselTechStyles({
    current: virtualIndex,
    windowStart,
    size: clampedVisible,
    animMode: animMode,
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
    activeDotIndex,
    isMoving,
    isJumping,
    moveReason,
    actualDuration,
    handleDotClick,
    handlePrev: handleMovePrevClick,
    handleNext: handleMoveNextClick,
    isFiniteAndAtStart,
    isFiniteAndAtEnd,
    isTouch,
    isReducedMotion,
  });

  const mergedStyles = useMemo(() => {
    const internalStyles = mergeStyles(
      styles,
      controlsVariables,
      paginationVariables,
    );
    if (!className) return internalStyles;
    return mergeStyles(internalStyles, className);
  }, [className]);

  const slideItemStyles = usePickStyles(mergedStyles, SLIDE_KEYS);

  if (totalSlides === 0) return null;

  return (
    <CarouselContext.Provider value={contextValue}>
      <div
        className={mergedStyles.outerContainer}
        role="region"
        aria-roledescription="carousel"
        data-touch={isTouch}
        data-reduced-motion={isReducedMotion}
      >
        <div
          ref={containerRef}
          tabIndex={-1}
          className={mergedStyles.innerContainer}
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
          {...bindDragListeners}
        >
          <div
            ref={movingRef}
            className={mergedStyles.slideContainer}
            onTransitionEnd={handleTransitionEnd}
            style={containerTechStyle}
          >
            {virtualSlides.map((vs) => {
              return (
                <SlideItem
                  key={vs.slideKey}
                  slideData={vs.slideData}
                  className={slideItemStyles}
                  style={slideWrapperTechStyle}
                  isContentImg={isContentImg}
                  errAltPlaceholder={actualErrAltPlaceholder}
                  onSlideClick={handleSlideClick}
                  isInteractive={isInteractive}
                  isActive={vs.isActive}
                  isActual={vs.isActual}
                  {...vs.a11yProps}
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
