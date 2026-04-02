import appStyles from "./App.module.scss";
import { useTheme } from "../support/theme_toggle/useThemeSwitcher";
//--------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------
import carousel1 from "../images/carousel1.jpg";
import carousel2 from "../images/carousel2.jpg";
import carousel3 from "../images/carousel3.jpg";
import carousel4 from "../images/carousel4.jpg";
import carousel5 from "../images/carousel5.jpg";
import carousel6 from "../images/carousel6.jpg";
import carousel7 from "../images/carousel7.jpg";
import carousel8 from "../images/carousel8.jpg";
import carousel9 from "../images/carousel9.jpg";
import carousel10 from "../images/carousel10.jpg";
import carousel11 from "../images/carousel11.jpg";
import carousel12 from "../images/carousel12.jpg";
import carousel13 from "../images/carousel13.jpg";
import carousel14 from "../images/carousel14.jpg";
import carousel15 from "../images/carousel15.jpg";
import carousel16 from "../images/carousel16.jpg";

import { useMemo, useState } from "react";
import { useMatchMedia, useIsTouchDevice } from "../shared";


import { PaginationWidget } from "../TEST-COMPONENT/pagination/pagination-widget/PaginationWidget";
import Carousel from "../TEST-COMPONENT/сarousel/Carousel";
import type { Slide } from "../TEST-COMPONENT/сarousel/Carousel.types";


//=====================================================================================================================================

const handleSlideClick = (dataUnit: Slide) => {
  const data = dataUnit.content;
  window.open(String(data), "_blank");
};

const carouselImgMock: Slide[] = [
  { id: "1", content: carousel1 },
  { id: "2", content: carousel2 },
  { id: "3", content: carousel3 },
  { id: "4", content: carousel4 },
  { id: "5", content: carousel5 },
  { id: "6", content: carousel6 },
  { id: "7", content: carousel7 },
  { id: "8", content: carousel8 },
  { id: "9", content: carousel9 },
  { id: "10", content: carousel10 },
  { id: "11", content: carousel11 },
  { id: "12", content: carousel12 },
  { id: "13", content: carousel13 },
  { id: "14", content: carousel14 },
  { id: "15", content: carousel15 },
  { id: "16", content: carousel16 },
];

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

  const visibleSlides = useMatchMedia(CAROUSEL_VIS);

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
            visibleSlides={visibleSlides}
            slides={carouselImgMock}
            isAuto={isAutoOn}
            isPaginated={true}
            isPaginationDynamic={true}
            isInteractive={true}
            speedAuto={4000}
            speedManualStep={2000}
            speedManualJump={800}
            delayAuto={3000}
            isTouchDevice={isTouch}
            onSlideClick={handleSlideClick}
          >
            <PaginationWidget/>
          </Carousel>
        </div>
      </section>
    </main>
  );
}
export default App;
