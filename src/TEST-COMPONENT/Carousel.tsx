import {
  useEffect,
  useMemo,
  memo,
  useReducer,
  useCallback,
  useRef,
} from "react";

import styles from "./Carousel.module.scss";
import controlsVariables from "./styles/Controls.variables.module.scss";
import paginationVariables from "./styles/Pagination.variables.module.scss";

import {
  useCarouselAutoPlay,
  useCarouselClick,
  useCarouselController,
  useCarouselEngine,
  useCarouselGesture,
  useCarouselGestureAnimation,
  useCarouselSlides,
  useCarouselSpeed,
  useCarouselTechStyles,
  usePerfectLayoutNotice,
  useSafeSettings,
} from "./hooks";

import {
  manageFocusShift,
  mergeStyles,
  useTimer,
  useComponentVisibility,
  useIsomorphicLayoutEffect,
  useIsReducedMotion,
  useIsTouchDevice,
  resolveSlots,
  usePickStyles,
} from "../shared";

import { SlideItem } from "./components";
import { getAnimStatus, initialState, reducer } from "./model/reducer";
import {
  VISIBILITY_THRESHOLD,
  ANIMATION_SAFETY_MARGIN,
  CAROUSEL_SLOTS,
} from "./model/constants";
import { DEFAULT_SETTINGS } from "./model/defaultSettings";
import { CarouselContext, useExternalRefBridge } from "./model/context";
import { SLIDE_KEYS, type CarouseProps } from "./Carousel.types";
import { getCarouselLayout, type CarouselLayout } from "./utilites";

const Carousel = memo((props: CarouseProps) => {
  const {
    slides = [],
    visibleSlides = DEFAULT_SETTINGS.visibleSlides,
    speedAuto: speedAutoBase = DEFAULT_SETTINGS.speedAutoBase,
    delayAuto = DEFAULT_SETTINGS.delayAuto,
    speedManualStep = DEFAULT_SETTINGS.speedManualStep,
    speedManualJump = DEFAULT_SETTINGS.speedManualJump,
    isImg = DEFAULT_SETTINGS.isImg,
    ErrAltPlaceholder = DEFAULT_SETTINGS.errAltPH,
    isAuto = DEFAULT_SETTINGS.isAuto,
    isPaginated = DEFAULT_SETTINGS.isPaginated,
    isPaginationDynamic = DEFAULT_SETTINGS.isPaginationDynamic,
    isInteractive = DEFAULT_SETTINGS.isInteractive,
    isInfinite = DEFAULT_SETTINGS.isInfinite,
    isControlsOn = DEFAULT_SETTINGS.isControlsOn,
    className,
    isInstantMotion,
    isTouchDevice,
    onSlideClick,
    children,
  } = props;

  const length = slides.length;
  if (length === 0) return null;

  const animatedTrackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const timer = useTimer();

  const isReducedMotion = isInstantMotion ?? useIsReducedMotion();
  const isTouch = isTouchDevice ?? useIsTouchDevice();
  const { visible: isVisible } = useComponentVisibility({
    elementRef: containerRef,
    threshold: VISIBILITY_THRESHOLD,
  });

  const { externalRef, connectedChildren } = useExternalRefBridge(children);

  const slots = useMemo(
    () => resolveSlots(connectedChildren, CAROUSEL_SLOTS),
    [connectedChildren],
  );

  const {
    speedAuto: safeSpeedAuto,
    speedStep: safeSpeedStep,
    speedJump: safeSpeedJump,
    delay: safeDelayAuto,
    errAltPH: actualErrAltPlaceholder,
  } = useSafeSettings({
    speedAuto: speedAutoBase,
    speedStep: speedManualStep,
    speedJump: speedManualJump,
    delay: delayAuto,
    errAltPH: ErrAltPlaceholder,
  });

  const nextLayout = useMemo<CarouselLayout>(
    () => getCarouselLayout(slides, visibleSlides, isInfinite),
    [slides, visibleSlides, isInfinite],
  );
  const { clampedVisible, canSlide, pageCount, cloneCount } = nextLayout;

  usePerfectLayoutNotice({
    length: length,
    visibleSlides: clampedVisible,
  });

  const [state, baseDispatch] = useReducer(reducer, nextLayout, initialState);
  const {
    currentIndex,
    prevIndex,
    currentLayout,
    animMode,
    moveReason,
    pendingAction,
  } = state;

  const { isMoving, isJumping, isAnimating, isInstant, isIdle } = useMemo(
    () => getAnimStatus(animMode),
    [animMode],
  );

  const {
    data: virtualSlides,
    activeDot: activeDotIndex,
    isAtStart: isFiniteAndAtStart,
    isAtEnd: isFiniteAndAtEnd,
  } = useCarouselSlides({
    current: currentIndex,
    prev: prevIndex,
    isMoving: isAnimating,
    layout: nextLayout,
    data: slides,
    count: length,
  });

  const { dispatch: componentDispatch, finalize: componentFinalize } =
    useCarouselEngine({
      dispatch: baseDispatch,
      isInstantMode: isReducedMotion,
      isMoving,
      currentLayout,
      nextLayout,
      pendingAction,
    });

  const {
    move: executeMove,
    goTo: executeGoTo,
    dragStart: executeDragStart,
    dragSnap: executeDragSnap,
    finalize: safeFinalizeMove,
  } = useCarouselController({
    dispatch: componentDispatch,
    finalize: componentFinalize,
    onReset: timer.clear,
    enabled: canSlide,
    externalController: externalRef,
  });

  const enabled = canSlide && !isMoving;
  const {
    isDragging: isDragging,
    velocity: velocity,
    dragListeners: bindDragListeners,
    getDragOffset: getDragOffset,
  } = useCarouselGesture({
    onDragStart: executeDragStart,
    onDragSnap: executeDragSnap,
    onMove: executeMove,
    enabled: enabled,
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
    offset: cloneCount,
    stepSize: clampedVisible,
    onClick: onSlideClick,
  });

  const isPaused = !isVisible || isDragging || isMoving;
  const { onHover } = useCarouselAutoPlay({
    enabled: isAuto,
    ignoreHover: isTouch,
    delay: safeDelayAuto,
    isPaused: isPaused,
    isAtEnd: isFiniteAndAtEnd,
    onGoTo: executeGoTo,
    onMove: executeMove,
  });

  const actualSpeed = useCarouselSpeed({
    velocity,
    reason: moveReason,
    animMode: animMode,
    isInteractive: isDragging,
    isInstant: isJumping,
    trackRef: containerRef,
    speedAuto: safeSpeedAuto,
    speedStep: safeSpeedStep,
    speedJump: safeSpeedJump,
  });

  useCarouselGestureAnimation({
    targetRef: animatedTrackRef,
    isDragging: isDragging,
    isLocked: isAnimating,
    isInstantMode: isReducedMotion,
    getOffset: getDragOffset,
  });

  const {
    containerStyle: containerTechStyle,
    itemStyle: slideWrapperTechStyle,
  } = useCarouselTechStyles({
    current: currentIndex,
    size: clampedVisible,
    animMode: animMode,
    isInteractive: isDragging,
    duration: actualSpeed,
    enabled: canSlide,
    reason: moveReason,
  });

  const handleTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName === "transform" && e.target === e.currentTarget) {
        safeFinalizeMove();
      }
    },
    [safeFinalizeMove],
  );

  useIsomorphicLayoutEffect(() => {
    if (isInstant || (isReducedMotion && isAnimating)) {
      safeFinalizeMove();
    }
  }, [isInstant, isReducedMotion, isAnimating, safeFinalizeMove]);

  useEffect(() => {
    if (isAnimating && !isReducedMotion && isVisible) {
      timer.set(safeFinalizeMove, actualSpeed + ANIMATION_SAFETY_MARGIN);
    }
    return () => timer.clear();
  }, [
    isVisible,
    isAnimating,
    isJumping,
    actualSpeed,
    isReducedMotion,
    timer,
    safeFinalizeMove,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (isIdle) {
      manageFocusShift(containerRef.current);
    }
  }, [isIdle, currentIndex]);

  useIsomorphicLayoutEffect(() => {
    externalRef.current?.toggleFreezed(isReducedMotion);
  }, [isReducedMotion, externalRef]);

  const contextValue = useMemo(
    () => ({
      pageCount,
      activeDotIndex,
      isMoving,
      isJumping,
      moveReason,
      actualSpeed,
      isPaginationDynamic,
      handleDotClick,
      handlePrev: handleMovePrevClick,
      handleNext: handleMoveNextClick,
      showAtStart: !isFiniteAndAtStart,
      showAtEnd: !isFiniteAndAtEnd,
      isTouch,
      isReducedMotion,
    }),
    [
      pageCount,
      activeDotIndex,
      isMoving,
      isJumping,
      moveReason,
      actualSpeed,
      isPaginationDynamic,
      handleDotClick,
      handleMovePrevClick,
      handleMoveNextClick,
      isFiniteAndAtStart,
      isFiniteAndAtEnd,
      isTouch,
      isReducedMotion,
    ],
  );

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
            ref={animatedTrackRef}
            className={mergedStyles.slideContainer}
            onTransitionEnd={handleTransitionEnd}
            style={containerTechStyle}
          >
            {virtualSlides.map((vs) => {
              return (
                <SlideItem
                  key={vs.slideKey}
                  slide={slides[vs.originalIndex]}
                  className={slideItemStyles}
                  style={slideWrapperTechStyle}
                  isImg={isImg}
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
        {isPaginated && slots.pagination}
      </div>
    </CarouselContext.Provider>
  );
});

export default Carousel;
