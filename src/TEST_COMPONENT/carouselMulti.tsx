import {
  useEffect,
  useMemo,
  memo,
  useReducer,
  useCallback,
  useRef,
} from "react";

import defaultStyles from "./carouselMulti.module.scss";

import { reducer, initialState, getAnimStatus } from "./reducer";
import { NavZone, Pagination, SlideItem } from "./components";
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
  useCarouselTimer,
  useIsomorphicLayoutEffect,
  usePerfectLayoutNotice,
  useSafeSettings,
} from "./hooks";

import { ANIMATION_SAFETY_MARGIN, VISIBILITY_THRESHOLD } from "./const";

import { getCarouselLayout } from "./utilites/utilites_component";

import {
  manageFocusShift,
  mergeBaseStyles,
  useComponentVisibility,
  useReducedMotion,
  useIsTouchScreen,
} from "../utilites_global";

import { DEFAULT_SETTINGS } from "./default_settings";
import type { CarouselLayout } from "./types/data.types";
import type { CarouselMultiProps } from "./types/types";

const CarouselMulti = memo((props: CarouselMultiProps) => {
  const {
    slides = [],
    visibleSlides = DEFAULT_SETTINGS.visibleSlides,
    speedAutoBase = DEFAULT_SETTINGS.speedAutoBase,
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
    className = DEFAULT_SETTINGS.className,
    isReducedMotionProp,
    isTouchProp,
    onSlideClick,
  } = props;

  const length = slides.length;
  if (length === 0) return null;

  const animatedTrackRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timer = useCarouselTimer();

  const isReducedMotion = isReducedMotionProp ?? useReducedMotion();
  const isTouch = isTouchProp ?? useIsTouchScreen();
  const { visible: isVisible } = useComponentVisibility({
    elementRef: containerRef,
    threshold: VISIBILITY_THRESHOLD,
  });

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
    handleMove: handleMoveClick,
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

  const baseMergedStyles = useMemo(
    () => mergeBaseStyles(defaultStyles, className),
    [className],
  );

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
  return (
    <div
      className={baseMergedStyles.outerContainer}
      role="region"
      aria-roledescription="carousel"
      data-touch={isTouch}
      data-reduced-motion={isReducedMotion}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        className={baseMergedStyles.innerContainer}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        {...bindDragListeners}
      >
        <div
          ref={animatedTrackRef}
          className={baseMergedStyles.slideContainer}
          onTransitionEnd={handleTransitionEnd}
          style={containerTechStyle}
        >
          {virtualSlides.map((vs) => {
            return (
              <SlideItem
                key={vs.slideKey}
                slide={slides[vs.originalIndex]}
                className={baseMergedStyles}
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
        {canSlide && (
          <>
            {!isFiniteAndAtStart && (
              <NavZone
                direction="left"
                onClick={() => handleMoveClick(-1)}
                className={baseMergedStyles}
              />
            )}
            {!isFiniteAndAtEnd && (
              <NavZone
                direction="right"
                onClick={() => handleMoveClick(1)}
                className={baseMergedStyles}
              />
            )}
          </>
        )}
      </div>
      {isPaginated && canSlide && (
        <Pagination
          pageCount={pageCount}
          activeDotIndex={activeDotIndex}
          onDotClick={handleDotClick}
          className={baseMergedStyles}
          isMoving={isMoving}
          isDynamic={isPaginationDynamic}
          isJump={isJumping}
          moveReason={moveReason}
          speed={actualSpeed}
        />
      )}
    </div>
  );
});
export default CarouselMulti;
