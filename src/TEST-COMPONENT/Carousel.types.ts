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

const CarouselClassSchema = z.object({
  outerContainer: z.string(),
  innerContainer: z.string(),
  slideContainer: z.string(),
});

const SlideItemClassSchema = z.object({
  slide: z.string(),
  slideInteractive: z.string(),
  slideError: z.string(),
  slideText: z.string(),
});

export const SLIDE_KEYS = SlideItemClassSchema.keyof().options;

const ClassNameMapSchema = z
  .object({
    ...CarouselClassSchema.shape,
    ...SlideItemClassSchema.shape,
  })
  .partial();

export type ClassNameMap = z.infer<typeof ClassNameMapSchema>;
export type SlideItemClassMap = Pick<ClassNameMap, (typeof SLIDE_KEYS)[number]>;

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

export const CarouselPropsSchema = z.object({
  slidesData: z.array(SlideSchema),
  visibleSlidesNr: z.number().optional(),
  isLayoutClamped: z.boolean().optional(),
  durationAutoplay: z.number().optional(),
  intervalAutoplay: z.number().optional(),
  durationStep: z.number().optional(),
  durationJump: z.number().optional(),
  isContentImg: z.boolean().optional(),
  isAuto: z.boolean().optional(),
  isPaginationOn: z.boolean().optional(),
  isControlsOn: z.boolean().optional(),
  isInteractive: z.boolean().optional(),
  isFinite: z.boolean().optional(),
  isInstantMotion: z.boolean().optional(),
  isTouchDevice: z.boolean().optional(),
  className: ClassNameMapSchema.optional(),
  onSlideClick: OnSlideClickSchema.optional(),
  errAltPlaceholder: z.string().optional(),
});

export interface CarouselProps extends z.infer<typeof CarouselPropsSchema> {
  children?: ReactNode;
}

//-------------------------------------------------------------------------------------------------

export const CarouselSlidesDataSchema = CarouselPropsSchema.shape.slidesData;
