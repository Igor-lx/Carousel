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
    const [isBroken, setIsBroken] = useState(false);
    const wasActualRef = useRef(Boolean(isActual));
    const imageSource =
      isContentImg && typeof slideData?.content === "string"
        ? slideData.content
        : null;

    useEffect(() => {
      setIsBroken(false);
    }, [imageSource]);

    useEffect(() => {
      const didBecomeActual = Boolean(isActual) && !wasActualRef.current;

      wasActualRef.current = Boolean(isActual);

      if (!didBecomeActual || !isBroken || !imageSource) {
        return;
      }

      let isDisposed = false;
      const probe = new Image();

      probe.onload = () => {
        if (!isDisposed) {
          setIsBroken(false);
        }
      };

      probe.onerror = () => {
        if (!isDisposed) {
          setIsBroken(true);
        }
      };

      probe.src = imageSource;

      return () => {
        isDisposed = true;
        probe.onload = null;
        probe.onerror = null;
      };
    }, [imageSource, isActual, isBroken]);

    if (!slideData) return null;

    const isClickable = !!onSlideClick && isInteractive && !isBroken;
    const Tag = isClickable ? "button" : "div";

    return (
      <Tag
        {...a11yProps}
        style={style}
        inert={!isActive ? true : undefined}
        data-active-zone={isActual}
        className={clsx(
          className.slide,
          isBroken && className.slideError,
          !isContentImg && className.slideText,
          isClickable && className.slideInteractive,
        )}
        {...(isClickable && { type: "button" })}
        onClick={isClickable ? () => onSlideClick?.(slideData) : undefined}
      >
        {isContentImg && typeof slideData.content === "string" ? (
          !isBroken ? (
            <img
              src={slideData.content}
              alt={slideData.alt || ""}
              draggable={false}
              onLoad={() => setIsBroken(false)}
              onError={() => setIsBroken(true)}
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
