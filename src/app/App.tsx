import appStyles from "./App.module.scss";
import { useTheme } from "../support/theme_toggle/useThemeSwitcher";
//--------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------
// Mobile imports
import m1 from "../images/Carousel/mobile/carousel1.webp";
import m2 from "../images/Carousel/mobile/carousel2.webp";
import m3 from "../images/Carousel/mobile/carousel3.webp";
import m4 from "../images/Carousel/mobile/carousel4.webp";
import m5 from "../images/Carousel/mobile/carousel5.webp";
import m6 from "../images/Carousel/mobile/carousel6.webp";
import m7 from "../images/Carousel/mobile/carousel7.webp";
import m8 from "../images/Carousel/mobile/carousel8.webp";
import m9 from "../images/Carousel/mobile/carousel9.webp";
import m10 from "../images/Carousel/mobile/carousel10.webp";
import m11 from "../images/Carousel/mobile/carousel11.webp";
import m12 from "../images/Carousel/mobile/carousel12.webp";

// Desktop imports
import d1 from "../images/Carousel/destktop/carousel1.webp";
import d2 from "../images/Carousel/destktop/carousel2.webp";
import d3 from "../images/Carousel/destktop/carousel3.webp";
import d4 from "../images/Carousel/destktop/carousel4.webp";
import d5 from "../images/Carousel/destktop/carousel5.webp";
import d6 from "../images/Carousel/destktop/carousel6.webp";
import d7 from "../images/Carousel/destktop/carousel7.webp";
import d8 from "../images/Carousel/destktop/carousel8.webp";
import d9 from "../images/Carousel/destktop/carousel9.webp";
import d10 from "../images/Carousel/destktop/carousel10.webp";
import d11 from "../images/Carousel/destktop/carousel11.webp";
import d12 from "../images/Carousel/destktop/carousel12.webp";

import { useMemo, useState } from "react";
import {
  useMatchMedia,
  useIsTouchDevice,
  injectSlot,
  PaginationWidget,
} from "../shared";

import Carousel from "../TEST-COMPONENT/Carousel";
import type { Slide } from "../TEST-COMPONENT/Carousel.types";

import { Controls, Pagination } from "../TEST-COMPONENT/components";

//=====================================================================================================================================

const handleSlideClick = (slideData: Slide) => {
  const content = slideData.content;
  window.open(String(content), "_blank");
};

const CAROUSEL_DATA = [
  { id: "1", DESKTOP: d1, MOBILE: m1 },
  { id: "2", DESKTOP: d2, MOBILE: m2 },
  { id: "3", DESKTOP: d3, MOBILE: m3 },
  { id: "4", DESKTOP: d4, MOBILE: m4 },
  { id: "5", DESKTOP: d5, MOBILE: m5 },
  { id: "6", DESKTOP: d6, MOBILE: m6 },
  { id: "7", DESKTOP: d7, MOBILE: m7 },
  { id: "8", DESKTOP: d8, MOBILE: m8 },
  { id: "9", DESKTOP: d9, MOBILE: m9 },
  { id: "10", DESKTOP: d10, MOBILE: m10 },
  { id: "11", DESKTOP: d11, MOBILE: m11 },
  { id: "12", DESKTOP: d12, MOBILE: m12 },
];

const VIS_CONFIG = {
  DESKTOP: 3,
  TABLET: 2,
  MOBILE: 1,
  DEFAULT: 3,
};

export const CarouselPaginationWidget = injectSlot(
  PaginationWidget,
  "pagination",
);

function App() {
  const { toggleTheme, theme } = useTheme();

  const isTouch = useIsTouchDevice();
  const [isAutoOn, setIsAutoOn] = useState(false);

  const device = useMatchMedia({
    DESKTOP: "DESKTOP",
    TABLET: "TABLET",
    MOBILE: "MOBILE",
    DEFAULT: "DEFAULT",
  }) as keyof typeof VIS_CONFIG;

  const visibleSlidesNr = VIS_CONFIG[device];

  const slidesData = useMemo(
    () =>
      CAROUSEL_DATA.map((s) => ({
        id: s.id,
        content: device === "MOBILE" ? s.MOBILE : s.DESKTOP,
      })),
    [device],
  );

  return (
    <main className={appStyles.app}>
      <section className={appStyles.page}>
        <div className={appStyles.header}>
          <button
            className={appStyles.button}
            onClick={() => setIsAutoOn((prev) => !prev)}
          >
            {isAutoOn ? "⏩" : "⏸️"}
          </button>
          <button
            className={appStyles.button}
            style={{ paddingBottom: 2 }}
            onClick={toggleTheme}
          >
            {theme === "light" ? "☀️" : "🌙"}
          </button>
        </div>

        <div className={appStyles.component}>
          <Carousel
            visibleSlidesNr={visibleSlidesNr}
            slidesData={slidesData}
            isAuto={isAutoOn}
            isPaginationOn={true}
            // isInstantMotion = {true}
            isInteractive={true}
            durationAutoplay={12000}
            durationStep={6000}
            durationJump={800}
            intervalAutoplay={3000}
            isLayoutClamped={true}
            isTouchDevice={isTouch}
            onSlideClick={handleSlideClick}
          >
            {isTouch ? <CarouselPaginationWidget /> : <Pagination />}
            <Controls />
          </Carousel>
        </div>
      </section>
      <section className={appStyles.page}></section>
    </main>
  );
}
export default App;
