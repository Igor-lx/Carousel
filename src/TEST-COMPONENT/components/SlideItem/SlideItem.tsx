import clsx from "clsx";
import { memo, useState, useEffect } from "react";
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

    useEffect(() => {
      setIsBroken(false);
    }, [slideData?.id, slideData?.content]);

    useEffect(() => {
      if (isActual) {
        setIsBroken(false);
      }
    }, [isActual]);

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
              loading="lazy"
              alt={slideData.alt || ""}
              draggable={false}
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
