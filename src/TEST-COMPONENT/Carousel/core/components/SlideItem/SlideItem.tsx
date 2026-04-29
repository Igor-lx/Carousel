import clsx from "clsx";
import { memo, useEffect, useRef, useState } from "react";
import type { SlideItemProps } from "./types";

export const SlideItem = memo(
  ({
    slideData,
    isContentImg,
    errAltPlaceholder,
    style,
    isActual,
    isActive,
    isInteractive,
    onSlideClick,
    className,
    ...a11yProps
  }: SlideItemProps) => {
    const [hasImageError, setHasImageError] = useState(false);
    const wasActualRef = useRef(Boolean(isActual));
    const imageSource =
      isContentImg && typeof slideData?.content === "string"
        ? slideData.content
        : null;

    useEffect(() => {
      setHasImageError(false);
    }, [imageSource]);

    useEffect(() => {
      const didBecomeActual = Boolean(isActual) && !wasActualRef.current;

      wasActualRef.current = Boolean(isActual);

      if (!didBecomeActual || !hasImageError || !imageSource) {
        return;
      }

      let isDisposed = false;
      const probe = new Image();

      probe.onload = () => {
        if (!isDisposed) {
          setHasImageError(false);
        }
      };

      probe.onerror = () => {
        if (!isDisposed) {
          setHasImageError(true);
        }
      };

      probe.src = imageSource;

      return () => {
        isDisposed = true;
        probe.onload = null;
        probe.onerror = null;
      };
    }, [imageSource, isActual, hasImageError]);

    if (!slideData) return null;

    const isClickable = !!onSlideClick && isInteractive && !hasImageError;
    const Tag = isClickable ? "button" : "div";

    return (
      <Tag
        {...a11yProps}
        style={style}
        inert={!isActive ? true : undefined}
        data-active-zone={isActual}
        className={clsx(
          className.slide,
          hasImageError && className.slideError,
          !isContentImg && className.slideText,
          isClickable && className.slideInteractive,
        )}
        {...(isClickable && { type: "button" })}
        onClick={isClickable ? () => onSlideClick?.(slideData) : undefined}
      >
        {isContentImg && typeof slideData.content === "string" ? (
          !hasImageError ? (
            <img
              src={slideData.content}
              alt={slideData.alt || ""}
              draggable={false}
              onLoad={() => setHasImageError(false)}
              onError={() => setHasImageError(true)}
            />
          ) : (
            slideData.alt || errAltPlaceholder
          )
        ) : (
          slideData.content
        )}
      </Tag>
    );
  },
);
