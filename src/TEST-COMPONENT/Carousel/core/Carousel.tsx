import { memo, useMemo, useReducer, useRef } from "react";

import styles from "./Carousel.module.scss";

import {
  useCarouselAutoPlay,
  useCarouselClickHandlers,
  useCarouselDragController,
  useCarouselDiagnosticContextValue,
  useCarouselModuleContextValue,
  useCarouselModuleRenderPolicy,
  useCarouselNavigationController,
  useCarouselEngine,
  useCarouselGesture,
  useCarouselMotion,
  useCarouselSlides,
  useCarouselMotionPlan,
  useCarouselResolvedSlideRecords,
  useCarouselRuntimeSettings,
  useCarouselSlots,
  useCarouselTrackPositionBridge,
  useResponsiveRepeatedClickSettings,
} from "./hooks";

import {
  manageFocusShift,
  mergeStyles,
  useComponentVisibility,
  useIsomorphicLayoutEffect,
  useIsReducedMotion,
  useIsTouchDevice,
  useNumericMotionController,
  usePickStyles,
} from "../../../shared";

import { SlideItem } from "./components/SlideItem/SlideItem";
import {
  getAnimationStatus,
  initialState,
  reconcileStateToLayout,
  reducer,
} from "./model/reducer";
import type { CarouselMotionStrategy } from "./model/motion-execution";
import { DEFAULT_SETTINGS } from "./model/config";
import {
  CarouselDiagnosticContext,
  CarouselModuleContext,
} from "./model/context";
import { useCarouselExternalControlSync } from "./external-control";
import { SLIDE_KEYS, type CarouselProps } from "./types";
import {
  getCarouselBoundaryState,
  getCarouselLayout,
  getSlideFlexStyle,
  type CarouselLayout,
} from "./utilities";

const Carousel = memo((props: CarouselProps) => {
  const {
    slidesData,
    visibleSlidesNr,
    durationAutoplay,
    durationStep,
    durationJump,
    intervalAutoplay,
    errAltPlaceholder,
    isPagePaddingOn = DEFAULT_SETTINGS.isPagePaddingOn,
    isContentImg = DEFAULT_SETTINGS.isContentImg,
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

  const containerRef = useRef<HTMLDivElement>(null);
  const movingRef = useRef<HTMLDivElement>(null);
  const motionController =
    useNumericMotionController<CarouselMotionStrategy>(0, "easing");

  const prefersReducedMotion = useIsReducedMotion();
  const detectedTouchDevice = useIsTouchDevice();
  const isReducedMotion = isInstantMotion ?? prefersReducedMotion;
  const isTouch = isTouchDevice ?? detectedTouchDevice;
  const { externalControlRef, slots } = useCarouselSlots(children);

  const { diagnosticPayload, runtimeSettings } = useCarouselRuntimeSettings({
    diagnosticSlot: slots.diagnostic,
    visibleSlidesNr,
    durationAutoplay,
    durationStep,
    durationJump,
    intervalAutoplay,
    errAltPlaceholder,
  });

  const {
    visibleSlidesCount,
    autoplayDuration,
    stepDuration,
    jumpDuration,
    autoplayInterval,
    errorAltPlaceholder,
    layoutSettings,
    interactionSettings,
    dragConfig,
    releaseMotionConfig,
    dragReleaseEpsilon,
    motionSettings,
  } = runtimeSettings;

  const responsiveRepeatedClickSettings = useResponsiveRepeatedClickSettings({
    repeatedClickSettings: runtimeSettings.repeatedClickSettings,
    isTouch,
  });

  const { visible: isVisible } = useComponentVisibility({
    elementRef: containerRef,
    threshold: interactionSettings.visibilityThreshold,
  });

  const { resolvedSlideRecords, perfectPageLayoutInfo } =
    useCarouselResolvedSlideRecords({
      slidesData,
      visibleSlidesCount,
      isPagePaddingOn,
    });

  const layout = useMemo<CarouselLayout>(
    () => getCarouselLayout(resolvedSlideRecords, visibleSlidesCount, isFinite),
    [resolvedSlideRecords, visibleSlidesCount, isFinite],
  );

  const [state, baseDispatch] = useReducer(reducer, layout, initialState);

  const syncedState = useMemo(
    () => reconcileStateToLayout(state, layout),
    [state, layout],
  );

  const {
    targetPageIndex,
    virtualIndex,
    fromVirtualIndex,
    followUpVirtualIndex,
    isRepeatedClickAdvance,
    animationMode,
    moveReason,
    gesturePointerReleaseVelocity,
    gestureUiReleaseVelocity,
  } = syncedState;

  const {
    canSlide,
    pageCount,
    visibleSlidesCount: layoutVisibleSlidesCount,
  } = layout;

  const { isMoving, isJumping, isInstant, isIdle } = useMemo(
    () => getAnimationStatus(animationMode),
    [animationMode],
  );

  const { isAtStart, isAtEnd } = useMemo(
    () => getCarouselBoundaryState(targetPageIndex, layout),
    [layout, targetPageIndex],
  );

  const { slides: virtualSlides, renderWindowStart } = useCarouselSlides({
    current: virtualIndex,
    prev: fromVirtualIndex,
    isMoving,
    renderWindowBufferMultiplier: layoutSettings.renderWindowBufferMultiplier,
    layout,
    slideRecords: resolvedSlideRecords,
  });

  const { dispatchAction, finalizeStep: finalizeEngineStep } =
    useCarouselEngine({
      dispatch: baseDispatch,
      isInstantMode: isReducedMotion,
      isMoving,
      layout,
      dragReleaseEpsilon,
      repeatedClickSettings: responsiveRepeatedClickSettings,
    });

  const {
    currentPositionRef: motionPositionRef,
    positionReaderRef: motionPositionReaderRef,
    applyPosition: applyTrackPosition,
    readCurrentPosition,
  } = useCarouselTrackPositionBridge({
    trackRef: movingRef,
    renderWindowStart,
    visibleSlidesCount: layoutVisibleSlidesCount,
    motionController,
  });

  const { move, goTo } = useCarouselNavigationController({
    dispatchAction,
    enabled: canSlide,
    readCurrentPosition,
  });

  const { startDrag, updateDrag, finishDrag } = useCarouselDragController({
    dispatchAction,
    enabled: canSlide,
    measureRef: containerRef,
    layout,
    baseVirtualIndex: virtualIndex,
    readCurrentPosition,
    applyDragPosition: applyTrackPosition,
  });

  const { isDragging, isInteracting, dragListeners } = useCarouselGesture({
    startDrag,
    updateDrag,
    finishDrag,
    enabled: canSlide,
    dragConfig,
    measureRef: containerRef,
  });

  const { handlePrev, handleNext, handlePageSelect, handleSlideClick } =
    useCarouselClickHandlers({
      onMove: move,
      onGoTo: goTo,
      onClick: onSlideClick,
    });

  const isAutoplayPaused = !isVisible || isInteracting || isMoving;
  const { handleHoverChange } = useCarouselAutoPlay({
    enabled: isAuto && canSlide,
    ignoreHover: isTouch,
    autoplayInterval,
    hoverPauseDelay: interactionSettings.hoverPauseDelay,
    isPaused: isAutoplayPaused,
    isAtEnd,
    onGoTo: goTo,
    onMove: move,
  });

  const { releaseMotion, motionDuration } = useCarouselMotionPlan({
    gesturePointerReleaseVelocity,
    moveReason,
    animationMode,
    isDragging,
    isInstant,
    isRepeatedClickAdvance,
    segmentStartVirtualIndex: fromVirtualIndex,
    targetVirtualIndex: virtualIndex,
    stepSize: layoutVisibleSlidesCount,
    motionSettings,
    repeatedClickSettings: responsiveRepeatedClickSettings,
    autoplayDuration,
    stepDuration,
    jumpDuration,
    releaseMotionConfig,
  });

  useCarouselMotion({
    motionController,
    currentPositionRef: motionPositionRef,
    positionReaderRef: motionPositionReaderRef,
    enabled: canSlide,
    startVirtualIndex: fromVirtualIndex,
    targetVirtualIndex: virtualIndex,
    stepSize: layoutVisibleSlidesCount,
    stepDuration,
    motionSettings,
    repeatedClickSettings: responsiveRepeatedClickSettings,
    releaseMotionConfig,
    isMoving,
    animationMode,
    moveReason,
    motionDuration,
    releaseMotion,
    gestureUiReleaseVelocity,
    isRepeatedClickAdvance,
    followUpVirtualIndex,
    onComplete: finalizeEngineStep,
  });

  const shouldSyncExternalControlMotion = isMoving && !isReducedMotion;
  useCarouselExternalControlSync({
    externalControlRef,
    motionController,
    motionDuration,
    targetPageIndex,
    pageCount,
    isFinite: layout.isFinite,
    visualOffsetStepSize: layoutVisibleSlidesCount,
    shouldSyncMotion: shouldSyncExternalControlMotion,
    shouldBindMotionSource: !isReducedMotion,
    shouldReportInvalidHandle: Boolean(slots.diagnostic),
  });

  const slideStyle = useMemo(
    () => getSlideFlexStyle(layoutVisibleSlidesCount),
    [layoutVisibleSlidesCount],
  );

  useIsomorphicLayoutEffect(() => {
    if (isIdle) {
      manageFocusShift(containerRef.current);
    }
  }, [isIdle, targetPageIndex]);

  const classNames = useMemo(
    () => (className ? mergeStyles(styles, className) : styles),
    [className],
  );

  const slideClassNames = usePickStyles(classNames, SLIDE_KEYS);

  const {
    hasControlsSlot,
    hasPaginationSlot,
    shouldRenderControls,
    shouldRenderPagination,
  } = useCarouselModuleRenderPolicy({
    controlsSlot: slots.controls,
    paginationSlot: slots.pagination,
    isControlsOn,
    isPaginationOn,
    canSlide,
  });

  const moduleContextValue = useCarouselModuleContextValue({
    pageCount,
    activePageIndex: targetPageIndex,
    isMoving,
    isJumping,
    moveReason,
    motionDuration,
    autoplayPaginationFactor: interactionSettings.autoplayPaginationFactor,
    handlePageSelect,
    handlePrev,
    handleNext,
    isAtStart,
    isAtEnd,
    isTouch,
    isReducedMotion,
  });

  const diagnosticContextValue = useCarouselDiagnosticContextValue({
    diagnosticPayload,
    perfectPageLayoutInfo,
    visibleSlidesCount: layoutVisibleSlidesCount,
    isControlsOn,
    hasControlsSlot,
    isPaginationOn,
    hasPaginationSlot,
  });

  return (
    <CarouselModuleContext.Provider value={moduleContextValue}>
      <CarouselDiagnosticContext.Provider value={diagnosticContextValue}>
        <div
          className={classNames.outerContainer}
          role="region"
          aria-roledescription="carousel"
          data-carousel-root=""
          data-touch={isTouch}
          data-reduced-motion={isReducedMotion}
        >
          <div
            ref={containerRef}
            tabIndex={-1}
            className={classNames.innerContainer}
            data-carousel-viewport=""
            onMouseEnter={() => handleHoverChange(true)}
            onMouseLeave={() => handleHoverChange(false)}
            {...dragListeners}
          >
            <div
              ref={movingRef}
              className={classNames.slideContainer}
              data-carousel-track=""
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
            {shouldRenderControls ? slots.controls : null}
          </div>
          {shouldRenderPagination ? slots.pagination : null}
          {slots.diagnostic}
        </div>
      </CarouselDiagnosticContext.Provider>
    </CarouselModuleContext.Provider>
  );
});

export default Carousel;
