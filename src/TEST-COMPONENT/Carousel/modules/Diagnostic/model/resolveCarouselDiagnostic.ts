import type {
  CarouselDiagnosticPayload,
  CarouselDiagnosticPropsInput,
} from "../../../core/model/diagnostic";
import { MIN_VISIBLE_SLIDES } from "./constraints";
import { resolveInteractionSettings } from "./interaction-settings";
import { resolveLayoutSettings } from "./layout-settings";
import {
  resolveDragConfig,
  resolveDragReleaseEpsilon,
  resolveMotionSettings,
  resolveReleaseMotionConfig,
} from "./pointer-motion-settings";
import {
  resolveDefaultPropSettings,
  resolveRuntimePropSettings,
} from "./prop-settings";
import { resolveRepeatedClickSettings } from "./repeated-click-settings";

export const resolveCarouselDiagnostic = (
  props: CarouselDiagnosticPropsInput,
): CarouselDiagnosticPayload => {
  const layoutResolution = resolveLayoutSettings();
  const defaultPropResolution = resolveDefaultPropSettings();
  const repeatedClickResolution = resolveRepeatedClickSettings();
  const interactionResolution = resolveInteractionSettings();
  const dragConfigResolution = resolveDragConfig();
  const releaseMotionConfigResolution = resolveReleaseMotionConfig();
  const dragReleaseEpsilonResolution = resolveDragReleaseEpsilon();
  const motionResolution = resolveMotionSettings();
  const propResolution = resolveRuntimePropSettings(
    props,
    defaultPropResolution.settings,
    {
      visibleSlidesNr: "visibleSlidesNr",
      durationAutoplay: "durationAutoplay",
      durationStep: "durationStep",
      durationJump: "durationJump",
      intervalAutoplay: "intervalAutoplay",
      errAltPlaceholder: "errAltPlaceholder",
    },
    MIN_VISIBLE_SLIDES,
  );

  return {
    settings: {
      ...propResolution.settings,
      layoutSettings: layoutResolution.settings,
      repeatedClickSettings: repeatedClickResolution.settings,
      interactionSettings: interactionResolution.settings,
      dragConfig: dragConfigResolution.settings,
      releaseMotionConfig: releaseMotionConfigResolution.settings,
      dragReleaseEpsilon: dragReleaseEpsilonResolution.setting,
      motionSettings: motionResolution.settings,
    },
    correctionEntries: [
      ...propResolution.corrections,
      ...defaultPropResolution.corrections,
      ...layoutResolution.corrections,
      ...interactionResolution.corrections,
      ...repeatedClickResolution.corrections,
      ...dragConfigResolution.corrections,
      ...releaseMotionConfigResolution.corrections,
      ...dragReleaseEpsilonResolution.corrections,
      ...motionResolution.corrections,
    ],
  };
};
