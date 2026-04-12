import { useMemo, memo, useReducer, useCallback, useRef, useEffect } from "react";

import styles from "./Carousel.module.scss";
import controlsVariables from "./styles/Controls.variables.module.scss";
import paginationVariables from "./styles/Pagination.variables.module.scss";

import {
  useCarouselAutoPlay,
  useCarouselClick,
  useCarouselController,
  useCarouselEngine,
  useCarouselGesture,
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
  useExternalRefBridge,
} from "../shared";

import { SlideItem } from "./components";
import { getAnimStatus, initialState, reducer } from "./model/reducer";
import { VISIBILITY_THRESHOLD, CAROUSEL_SLOTS } from "./model/constants";
import { DEFAULT_SETTINGS } from "./model/defaultSettings";
import { CarouselContext } from "./model/context";
import { SLIDE_KEYS, type CarouseProps } from "./Carousel.types";
import { getCarouselLayout, type CarouselLayout } from "./utilites";
import type { CarouselExternalController } from "./model/context/types";

const Carousel = memo((props: CarouseProps) => {
  const {
    slides = [],
    visibleSlides = DEFAULT_SETTINGS.visibleSlides,
    speedAuto: speedAutoBase = DEFAULT_SETTINGS.speedAutoBase,
    delayAuto = DEFAULT_SETTINGS.delayAuto,
    speedManualStep = DEFAULT_SETTINGS.speedManualStep,
    speedManualJump = DEFAULT_SETTINGS.speedManualJump,
    isImg = DEFAULT_SETTINGS.isImg,
    errAltPlaceholder = DEFAULT_SETTINGS.errAltPlaceholder,
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
  const containerRef = useRef<HTMLDivElement>(null);
  const movingRef = useRef<HTMLDivElement>(null);
  const resetMotion = useCallback(() => {}, []);

  const isReducedMotion = isInstantMotion ?? useIsReducedMotion();
  const isTouch = isTouchDevice ?? useIsTouchDevice();
  const { visible: isVisible } = useComponentVisibility({
    elementRef: containerRef,
    threshold: VISIBILITY_THRESHOLD,
  });

  const { instanceRef: externalRef, connectedChildren } =
    useExternalRefBridge<CarouselExternalController>(children);

  const slots = useMemo(
    () => resolveSlots(connectedChildren, CAROUSEL_SLOTS),
    [connectedChildren],
  );

  const {
    speedAuto: safeSpeedAuto,
    speedStep: safeSpeedStep,
    speedJump: safeSpeedJump,
    delay: safeDelayAuto,
    errAltPlaceholder: actualErrAltPlaceholder,
  } = useSafeSettings({
    speedAuto: speedAutoBase,
    speedStep: speedManualStep,
    speedJump: speedManualJump,
    delay: delayAuto,
    errAltPlaceholder,
  });

  const nextLayout = useMemo<CarouselLayout>(
    () => getCarouselLayout(slides, visibleSlides, isInfinite),
    [slides, visibleSlides, isInfinite],
  );

  const [state, baseDispatch] = useReducer(reducer, nextLayout, initialState);

  const {
    targetIndex,
    virtualIndex,
    fromVirtualIndex,
    currentLayout,
    animMode,
    moveReason,
    pendingTransition,
  } = state;

  const { canSlide, pageCount, clampedVisible } = currentLayout;

  usePerfectLayoutNotice({
    length: length,
    visibleSlides: clampedVisible,
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
    layout: currentLayout,
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
    });

  const {
    move: executeMove,
    goTo: executeGoTo,
    dragStart: executeDragStart,
    dragSnap: executeDragSnap,
    finalize: safeFinalizeMove,
    activeSpeed,
  } = useCarouselController({
    dispatch: componentDispatch,
    finalize: componentFinalize,
    onReset: resetMotion,
    enabled: canSlide,
    externalController: externalRef,
    isMoving,
    baseSpeed: safeSpeedStep,
    measureRef: containerRef,
    movingRef,
    layout: currentLayout,
    state,
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
    isInstant,
    viewportRef: containerRef,
    speedAuto: safeSpeedAuto,
    speedStep: activeSpeed,
    speedJump: safeSpeedJump,
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
    duration: actualSpeed,
    enabled: canSlide,
    reason: moveReason,
    dragOffset: offset,
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
    if (pendingTransition) {
      componentDispatch({ type: "COMMIT_REBASE" });
    }
  }, [pendingTransition, componentDispatch]);

  useIsomorphicLayoutEffect(() => {
    if (isIdle) {
      manageFocusShift(containerRef.current);
    }
  }, [isIdle, targetIndex]);

  useIsomorphicLayoutEffect(() => {
    externalRef.current?.toggleFreezed(isReducedMotion);
  }, [isReducedMotion, externalRef]);

  useIsomorphicLayoutEffect(() => {
    externalRef.current?.setDuration(actualSpeed);
  }, [actualSpeed, externalRef]);

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

  if (length === 0) return null;

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
