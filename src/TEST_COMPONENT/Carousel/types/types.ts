import { z } from "zod";
import { type ReactElement, type ReactNode } from "react";

const ReactElementSchema = z.custom<ReactElement>(
  (val) =>
    typeof val === "object" &&
    val !== null &&
    ((val as any)?.$$typeof === Symbol.for("react.element") ||
      (val as any)?.$$typeof === Symbol.for("react.transitional.element")),
);

const ContentSchema = z.union([
  z.string().trim().min(1),
  z.number(),
  ReactElementSchema,
]);

export const ClassNameMapSchema = z
  .object({
    outerContainer: z.string(),
    innerContainer: z.string(),
    slideContainer: z.string(),
    slide: z.string(),
    navZone: z.string(),
    navZoneL: z.string(),
    navZoneR: z.string(),
    navButton: z.string(),
    slideInteractive: z.string(),
    slideError: z.string(),
    slideText: z.string(),
  })
  .partial();

export type ClassNameMap = z.infer<typeof ClassNameMapSchema>;

const SlideSchema = z.object({
  id: z.union([z.string(), z.number()]),
  content: ContentSchema,
  alt: z.string().optional(),
});

export type Slide = z.infer<typeof SlideSchema>;

const OnSlideClickSchema = z.function({
  input: [SlideSchema],
  output: z.void(),
});

export const CarouselMultiPropsSchema = z.object({
  slides: z.array(SlideSchema),
  visibleSlides: z.number().optional(),
  speedAuto: z.number().optional(),
  delayAuto: z.number().optional(),
  speedManualStep: z.number().optional(),
  speedManualJump: z.number().optional(),
  isImg: z.boolean().optional(),
  isAuto: z.boolean().optional(),
  isPaginated: z.boolean().optional(),
  isControlsOn: z.boolean().optional(),
  isPaginationDynamic: z.boolean().optional(),
  isInteractive: z.boolean().optional(),
  isInfinite: z.boolean().optional(),
  isInstantMotion: z.boolean().optional(),
  isTouchDevice: z.boolean().optional(),
  className: ClassNameMapSchema.optional(),
  onSlideClick: OnSlideClickSchema.optional(),
  ErrAltPlaceholder: z.string().optional(),
});

export type CarouselMultiProps = z.infer<typeof CarouselMultiPropsSchema> & {
  children?: ReactNode;
};

//-------------------------------------------------------------------------------------------------

export const CarouselSlideDataSchema = CarouselMultiPropsSchema.shape.slides;
