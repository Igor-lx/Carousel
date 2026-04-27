import {
  isValidElement,
  memo,
  useCallback,
  useMemo,
  useReducer,
  useRef,
} from "react";

import styles from "./Carousel.module.scss";

import {
  useCarouselAutoPlay,
  useCarouselClick,
  useCarouselController,
  useCarouselModuleApiValue,
  useCarouselEngine,
  useCarouselGesture,
  useCarouselMotion,
  useCarouselSlides,
  useCarouselMotionDuration,
  useResponsiveRepeatedClickSettings,
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
  velocityEngine,
} from "../../../shared";

import { SlideItem } from "./components";
import {
  getAnimStatus,
  initialState,
  reconcileStateToLayout,
  reducer,
} from "./model/reducer";
import {
  DEFAULT_SETTINGS,
} from "./model/config";
import {
  EMPTY_DIAGNOSTIC_CORRECTIONS,
  type CarouselDiagnosticPropsInput,
  type CarouselDiagnosticResolver,
  resolveRawCarouselRuntimeSettings,
} from "./model/diagnostic";
import {
  CarouselDiagnosticContext,
  CarouselModuleApiContext,
} from "./model/context";
import { CAROUSEL_SLOTS } from "./model/slots";
import {
  type CarouselExternalControlHandle,
  useCarouselExternalControlSync,
} from "./external-control";
import { SLIDE_KEYS, type CarouselProps } from "./types";
import {
  applyTrackPositionStyle,
  buildSlideRecords,
  extendSlideRecordsToFullPages,
  getCarouselLayout,
  getDurationByVirtualSpan,
  getSlideFlexStyle,
  hasPartialPageLayout,
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
    isLayoutClamped: isLayoutClampingEnabled = DEFAULT_SETTINGS.isLayoutClamped,
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

  const totalSlides = slidesData.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const movingRef = useRef<HTMLDivElement>(null);
  const motionPositionRef = useRef(0);
  const motionPositionReaderRef = useRef<() => number>(
    () => motionPositionRef.current,
  );

  const isReducedMotion = isInstantMotion ?? useIsReducedMotion();
  const isTouch = isTouchDevice ?? useIsTouchDevice();
  const {
    instanceRef: externalControlRef,
    connectedChildren: childrenWithExternalControlRef,
  } = useExternalRefBridge<CarouselExternalControlHandle>(children);

  const slots = useMemo(
    () => resolveSlots(childrenWithExternalControlRef, CAROUSEL_SLOTS),
    [childrenWithExternalControlRef],
  );
  const rawDiagnosticInput = useMemo<CarouselDiagnosticPropsInput>(
    () => ({
      visibleSlidesNr: rawVisibleSlidesNr,
      durationAutoplay: rawDurationAutoplay,
      durationStep: rawDurationStep,
      durationJump: rawDurationJump,
      intervalAutoplay: rawIntervalAutoplay,
      errAltPlaceholder: rawErrAltPlaceholder,
    }),
    [
      rawDurationAutoplay,
      rawDurationJump,
      rawDurationStep,
      rawErrAltPlaceholder,
      rawIntervalAutoplay,
      rawVisibleSlidesNr,
    ],
  );
  const rawRuntimeSettings = useMemo(
    () => resolveRawCarouselRuntimeSettings(rawDiagnosticInput),
    [rawDiagnosticInput],
  );
  const diagnosticResolver = useMemo(
    () => {
      if (!isValidElement(slots.diagnostic)) {
        return null;
      }

      const resolver = (
        slots.diagnostic.type as { resolveDiagnostic?: CarouselDiagnosticResolver }
      ).resolveDiagnostic;

      return typeof resolver === "function" ? resolver : null;
    },
    [slots.diagnostic],
  );
  const diagnosticPayload = useMemo(
    () => diagnosticResolver?.(rawDiagnosticInput) ?? null,
    [diagnosticResolver, rawDiagnosticInput],
  );
  const runtimeSettings = diagnosticPayload?.settings ?? rawRuntimeSettings;

  const {
    visibleSlidesCount,
    autoplayDuration,
    stepDuration,
    jumpDuration,
    autoplayInterval,
    errorAltPlaceholder,
    layoutSettings,
    repeatedClickSettings,
    interactionSettings,
    dragConfig,
    releaseMotionConfig,
    dragReleaseEpsilon,
    motionSettings,
  } = runtimeSettings;
  const responsiveRepeatedClickSettings = useResponsiveRepeatedClickSettings({
    repeatedClickSettings,
    isTouch,
  });
  const { visible: isVisible } = useComponentVisibility({
    elementRef: containerRef,
    threshold: interactionSettings.visibilityThreshold,
  });

  const hasPartialPageLayoutMismatch = hasPartialPageLayout(
    totalSlides,
    visibleSlidesCount,
  );
  const didExtendPartialPageLayout =
    isLayoutClampingEnabled && hasPartialPageLayoutMismatch;

  const baseSlideRecords = useMemo(
    () => buildSlideRecords(slidesData),
    [slidesData],
  );

  const layoutSlideRecords = useMemo(
    () =>
      didExtendPartialPageLayout
        ? extendSlideRecordsToFullPages(
            baseSlideRecords,
            visibleSlidesCount,
          )
        : baseSlideRecords,
    [
      didExtendPartialPageLayout,
      baseSlideRecords,
      visibleSlidesCount,
    ],
  );

  const nextLayout = useMemo<CarouselLayout>(
    () =>
      getCarouselLayout(
        layoutSlideRecords,
        visibleSlidesCount,
        isFinite,
      ),
    [
      layoutSlideRecords,
      visibleSlidesCount,
      isFinite,
    ],
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

  const perfectPageLayoutNoticeInput = useMemo(
    () => ({
      hasPerfectPageLayout: !hasPartialPageLayoutMismatch,
      rawLength: totalSlides,
      extendedLength: layoutSlideRecords.length,
      visibleSlidesCount: clampedVisible,
      didExtendLayout: didExtendPartialPageLayout,
    }),
    [
      clampedVisible,
      didExtendPartialPageLayout,
      hasPartialPageLayoutMismatch,
      layoutSlideRecords.length,
      totalSlides,
    ],
  );

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
    slidesData: layoutSlideRecords,
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

  const applyDragPosition = useCallback(
    (position: number) => {
      motionPositionRef.current = position;

      const track = movingRef.current;
      if (!track) return;

      applyTrackPositionStyle(track, position, windowStart, clampedVisible);
    },
    [clampedVisible, windowStart],
  );

  const readCurrentPosition = useCallback(
    () => motionPositionReaderRef.current(),
    [],
  );

  const { move, goTo, startDrag, updateDrag, finishDrag } =
    useCarouselController({
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

  const { isDragging, isInteracting, dragListeners } = useCarouselGesture({
    onPressStart: startDrag,
    onDragMove: updateDrag,
    onRelease: finishDrag,
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

  const gestureReleaseMotion = useMemo(
    () =>
      velocityEngine.resolveReleaseMotion({
        gestureReleaseVelocity: gesturePointerReleaseVelocity,
        distanceToTarget: virtualIndex - fromVirtualIndex,
        baseDuration: getDurationByVirtualSpan({
          from: fromVirtualIndex,
          to: virtualIndex,
          stepSize: clampedVisible,
          baseDuration: stepDuration,
        }),
        config: releaseMotionConfig,
      }),
    [
      clampedVisible,
      fromVirtualIndex,
      gesturePointerReleaseVelocity,
      releaseMotionConfig,
      stepDuration,
      virtualIndex,
    ],
  );

  const motionDuration = useCarouselMotionDuration({
    gestureReleaseDuration: gestureReleaseMotion.duration,
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
    gestureReleaseMotion,
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

  const moduleApi = useCarouselModuleApiValue({
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

  const classNames = useMemo(
    () =>
      className
        ? mergeStyles(styles, className)
        : styles,
    [className],
  );

  const slideClassNames = usePickStyles(classNames, SLIDE_KEYS);
  const hasControlsSlot = Boolean(slots.controls);
  const hasPaginationSlot = Boolean(slots.pagination);
  const slotAttachmentNoticeInput = useMemo(
    () => ({
      isControlsOn,
      hasControlsSlot,
      isPaginationOn,
      hasPaginationSlot,
    }),
    [hasControlsSlot, hasPaginationSlot, isControlsOn, isPaginationOn],
  );
  const diagnosticContextValue = useMemo(
    () => ({
      correctionEntries:
        diagnosticPayload?.correctionEntries ?? EMPTY_DIAGNOSTIC_CORRECTIONS,
      perfectPageLayoutNoticeInput,
      slotAttachmentNoticeInput,
    }),
    [
      diagnosticPayload?.correctionEntries,
      perfectPageLayoutNoticeInput,
      slotAttachmentNoticeInput,
    ],
  );

  const shouldRenderControls = isControlsOn && canSlide && hasControlsSlot;

  const shouldRenderPagination = isPaginationOn && hasPaginationSlot;


  return (
    <CarouselModuleApiContext.Provider value={moduleApi}>
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
    </CarouselModuleApiContext.Provider>
  );
});

export default Carousel;
