import { memo, useMemo, useReducer, useRef } from "react";

import styles from "./Carousel.module.scss";

import {
  useCarouselAutoPlay,
  useCarouselClick,
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
  usePickStyles,
} from "../../../shared";

import { SlideItem } from "./components";
import {
  getAnimStatus,
  initialState,
  reconcileStateToLayout,
  reducer,
} from "./model/reducer";
import { DEFAULT_SETTINGS } from "./model/config";
import {
  CarouselDiagnosticContext,
  CarouselModuleContext,
} from "./model/context";
import { useCarouselExternalControlSync } from "./external-control";
import { SLIDE_KEYS, type CarouselProps } from "./types";
import {
  getCarouselLayout,
  getSlideFlexStyle,
  type CarouselLayout,
} from "./utilities";

const Carousel = memo((props: CarouselProps) => {
  const rawVisibleSlidesNr = props.visibleSlidesNr;
  const rawDurationAutoplay = props.durationAutoplay;
  const rawDurationStep = props.durationStep;
  const rawDurationJump = props.durationJump;
  const rawIntervalAutoplay = props.intervalAutoplay;
  const rawErrAltPlaceholder = props.errAltPlaceholder;

  const {
    slidesData = [],
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
  const motionPositionRef = useRef(0);
  const motionPositionReaderRef = useRef<() => number>(
    () => motionPositionRef.current,
  );

  const isReducedMotion = isInstantMotion ?? useIsReducedMotion();
  const isTouch = isTouchDevice ?? useIsTouchDevice();
  const { externalControlRef, slots } = useCarouselSlots(children);

  const { diagnosticPayload, runtimeSettings } = useCarouselRuntimeSettings({
    diagnosticSlot: slots.diagnostic,
    visibleSlidesNr: rawVisibleSlidesNr,
    durationAutoplay: rawDurationAutoplay,
    durationStep: rawDurationStep,
    durationJump: rawDurationJump,
    intervalAutoplay: rawIntervalAutoplay,
    errAltPlaceholder: rawErrAltPlaceholder,
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

  const nextLayout = useMemo<CarouselLayout>(
    () => getCarouselLayout(resolvedSlideRecords, visibleSlidesCount, isFinite),
    [resolvedSlideRecords, visibleSlidesCount, isFinite],
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
    gesturePointerReleaseVelocity,
    gestureUiReleaseVelocity,
  } = syncedState;

  const { canSlide, pageCount, clampedVisible } = nextLayout;

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
    renderWindowBufferMultiplier: layoutSettings.renderWindowBufferMultiplier,
    layout: nextLayout,
    slidesData: resolvedSlideRecords,
  });

  const { dispatchAction, finalizeStep: finalizeEngineStep } =
    useCarouselEngine({
      dispatch: baseDispatch,
      isInstantMode: isReducedMotion,
      isMoving,
      layout: nextLayout,
      dragReleaseEpsilon,
      repeatedClickSettings: responsiveRepeatedClickSettings,
    });

  const { applyDragPosition, readCurrentPosition } =
    useCarouselTrackPositionBridge({
      trackRef: movingRef,
      currentPositionRef: motionPositionRef,
      positionReaderRef: motionPositionReaderRef,
      windowStart,
      visibleSlidesCount: clampedVisible,
    });

  const { move, goTo } = useCarouselNavigationController({
    dispatchAction,
    enabled: canSlide,
    currentPositionRef: motionPositionRef,
    readCurrentPosition,
  });

  const { startDrag, updateDrag, finishDrag } =
    useCarouselDragController({
      dispatchAction,
      enabled: canSlide,
      measureRef: containerRef,
      layout: nextLayout,
      baseVirtualIndex: virtualIndex,
      dragReleaseEpsilon,
      currentPositionRef: motionPositionRef,
      readCurrentPosition,
      applyDragPosition,
    });

  const gestureController = useMemo(
    () => ({
      startDrag,
      updateDrag,
      finishDrag,
    }),
    [finishDrag, startDrag, updateDrag],
  );

  const { isDragging, isInteracting, dragListeners } = useCarouselGesture({
    controller: gestureController,
    enabled: canSlide,
    dragConfig,
    measureRef: containerRef,
  });

  const { handlePrev, handleNext, handlePageSelect, handleSlideClick } =
    useCarouselClick({
      onMove: move,
      onGoTo: goTo,
      onClick: onSlideClick,
    });

  const isPaused = !isVisible || isInteracting || isMoving;
  const { onHover } = useCarouselAutoPlay({
    enabled: isAuto && canSlide,
    ignoreHover: isTouch,
    autoplayInterval,
    hoverPauseDelay: interactionSettings.hoverPauseDelay,
    isPaused,
    isAtEnd,
    onGoTo: goTo,
    onMove: move,
  });

  const { releaseMotion, motionDuration } = useCarouselMotionPlan({
    gesturePointerReleaseVelocity,
    reason: moveReason,
    animMode,
    isDragging,
    isInstant,
    isRepeatedClickAdvance,
    segmentStartVirtualIndex: fromVirtualIndex,
    targetVirtualIndex: virtualIndex,
    stepSize: clampedVisible,
    motionSettings,
    repeatedClickSettings: responsiveRepeatedClickSettings,
    autoplayDuration,
    stepDuration,
    jumpDuration,
    releaseMotionConfig,
  });

  useCarouselMotion({
    trackRef: movingRef,
    currentPositionRef: motionPositionRef,
    positionReaderRef: motionPositionReaderRef,
    enabled: canSlide,
    startVirtualIndex: fromVirtualIndex,
    currentVirtualIndex: virtualIndex,
    windowStart,
    size: clampedVisible,
    stepDuration,
    motionSettings,
    repeatedClickSettings: responsiveRepeatedClickSettings,
    releaseMotionConfig,
    isMoving,
    animMode,
    reason: moveReason,
    duration: motionDuration,
    releaseMotion,
    gestureUiReleaseVelocity,
    isRepeatedClickAdvance,
    followUpVirtualIndex,
    onComplete: finalizeEngineStep,
  });

  const shouldSyncExternalControlMotion = isMoving && !isReducedMotion;
  useCarouselExternalControlSync({
    externalControlRef,
    motionDuration,
    targetIndex,
    pageCount,
    isFinite: nextLayout.isFinite,
    shouldSyncMotion: shouldSyncExternalControlMotion,
  });

  const slideStyle = useMemo(
    () => getSlideFlexStyle(clampedVisible),
    [clampedVisible],
  );

  useIsomorphicLayoutEffect(() => {
    if (isIdle) {
      manageFocusShift(containerRef.current);
    }
  }, [isIdle, targetIndex]);

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
    activePageIndex: targetIndex,
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
    visibleSlidesCount: clampedVisible,
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
            onMouseEnter={() => onHover(true)}
            onMouseLeave={() => onHover(false)}
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
