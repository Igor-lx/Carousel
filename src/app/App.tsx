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

const handleSlideClick = (dataUnit: Slide) => {
  const data = dataUnit.content;
  window.open(String(data), "_blank");
};

const carouselImgMockM: Slide[] = [
  { id: "1", content: m1 },
  { id: "2", content: m2 },
  { id: "3", content: m3 },
  { id: "4", content: m4 },
  { id: "5", content: m5 },
  { id: "6", content: m6 },
  { id: "7", content: m7 },
  { id: "8", content: m8 },
  { id: "9", content: m9 },
  { id: "10", content: m10 },
  { id: "11", content: m11 },
  { id: "12", content: m12 },
];

const carouselImgMockDT: Slide[] = [
  { id: "1", content: d1 },
  { id: "2", content: d2 },
  { id: "3", content: d3 },
  { id: "4", content: d4 },
  { id: "5", content: d5 },
  { id: "6", content: d6 },
  { id: "7", content: d7 },
  { id: "8", content: d8 },
  { id: "9", content: d9 },
  { id: "10", content: d10 },
  { id: "11", content: d11 },
  { id: "12", content: d12 },
];

export const CarouselPaginationWidget = injectSlot(
  PaginationWidget,
  "pagination",
);

function App() {
  const { toggleTheme, theme } = useTheme();

  const isTouch = useIsTouchDevice();
  const [isAutoOn, setIsAutoOn] = useState(false);

  const CAROUSEL_VIS = useMemo(
    () => ({
      DESKTOP: 4,
      TABLET: 2,
      MOBILE: 1,
      DEFAULT: 3,
    }),
    [],
  );

  const visibleSlidesNr = useMatchMedia(CAROUSEL_VIS);

  const slides = useMatchMedia({
    DESKTOP: carouselImgMockDT,
    TABLET: carouselImgMockDT,
    MOBILE: carouselImgMockM,
    DEFAULT: carouselImgMockDT,
  });

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
            visibleSlides={visibleSlidesNr}
            slides={slides}
            isAuto={isAutoOn}
            isPaginated={true}
            // isInstantMotion = {true}
            isPaginationDynamic={true}
            isInteractive={true}
            speedAuto={4000}
            speedManualStep={2000}
            speedManualJump={800}
            delayAuto={3000}
            isTouchDevice={isTouch}
            onSlideClick={handleSlideClick}
          >
            {isTouch ? <CarouselPaginationWidget /> : <Pagination />}
            <Controls />
          </Carousel>
        </div>
      </section>
    </main>
  );
}
export default App;
