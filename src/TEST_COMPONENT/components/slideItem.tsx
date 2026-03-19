import clsx from "clsx";
import { memo, useState, useEffect } from "react";
import type { SlideItemProps } from "../types";


export const SlideItem = memo(
  ({
    slide,
    isImg,
    errAltPlaceholder,
    className,
    style,
    isActual,
    isActive,
    isInteractive,
    onSlideClick,
    ...a11yProps
  }: SlideItemProps) => {
    if (!slide) return null;
    const [isBroken, setIsBroken] = useState(false);

    useEffect(() => setIsBroken(false), [slide.id, slide.content]);

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
          !isImg && className.slideText,
          isClickable && className.interactive,
        )}
        {...(isClickable && { type: "button" })}
        onClick={isClickable ? () => onSlideClick?.(slide) : undefined}
      >
        {isImg && typeof slide.content === "string" ? (
          !isBroken ? (
            <img
              src={slide.content}
              alt={slide.alt || ""}
              draggable={false}
              onError={() => setIsBroken(true)}
            />
          ) : (
            slide.alt || errAltPlaceholder
          )
        ) : (
          slide.content
        )}
      </Tag>
    );
  },
);
