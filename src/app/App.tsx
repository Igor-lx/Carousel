import appStyles from "./App.module.scss";
import { useTheme } from "../support/theme_toggle/useThemeSwitcher";
import clsx from "clsx";
//--------------------------------------------------------------------------------------------
import custom_styles from "../custom_styles/override_styles.module.scss";
//--------------------------------------------------------------------------------------------

import { useValidationData } from "../support/data_processing/validation/useValidationData";
import {
  useLocalization,
  useLocalizedData,
} from "../support/localization/hooks/useLocalization";
import { toggleLanguage } from "../support/localization/controls/toggler";

//--------------------------------------------------------------------------------------------

//-------------------------------------------------------------------------------------------
import carousel1 from "../images/carousel1.jpg";
import carousel2 from "../images/carousel2.jpg";
import carousel3 from "../images/carousel3.jpg";
import carousel4 from "../images/carousel4.jpg";
import carousel5 from "../images/carousel5.jpg";
import carousel6 from "../images/carousel6.jpg";
import carousel8 from "../images/carousel8.jpg";
import carousel9 from "../images/carousel9.jpg";
import carousel10 from "../images/carousel10.jpg";
import carousel11 from "../images/carousel11.jpg";
import carousel12 from "../images/carousel12.jpg";
import carousel13 from "../images/carousel13.jpg";
import carousel14 from "../images/carousel14.jpg";
import carousel15 from "../images/carousel15.jpg";
import carousel16 from "../images/carousel16.jpg";

import CarouselMulti from "../TEST_COMPONENT/carouselMulti";
import { useMemo, useState } from "react";
import { useMatchMedia, useIsTouchScreen } from "../utilites_global";
import {
  type Slide,
  CarouselSlideDataSchema,
} from "../TEST_COMPONENT/types/types";

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
  { id: "7", content: "src/images/carousel7.jpg", alt: "alt text" },
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

const carouselTextMock: Slide[] = [
  { id: "1", content: "slide_1" },
  { id: "2", content: "slide_2" },
  { id: "3", content: "slide_3" },
];

const fallback: Slide = {
  id: "Fallback-ID",
  content: <p>DATA IS LOADING.... </p>,
  alt: "Fallback slide",
};

function App() {
  const { toggleTheme, theme } = useTheme();

  const isTouch = useIsTouchScreen();

  const [isAutoOn, setIsAutoOn] = useState(false);
  const [isPaginated, setIsPaginated] = useState(true);
  const [isInteractive, setIsInteractive] = useState(true);
  const [isImg, setIsImg] = useState(true);
  const [isInfinite, setIsInfinite] = useState(true);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const [visSlides, setVisibleSlides] = useState(4);

  const CAROUSEL_VIS = useMemo(
    () => ({
      DESKTOP: visSlides,
      TABLET: 2,
      MOBILE: 1,
      DEFAULT: 3,
    }),
    [visSlides],
  );

  const visibleSlides = useMatchMedia(CAROUSEL_VIS);

  const toggleVisibleSlides = () => {
    setVisibleSlides((prev) => {
      const nextValue = prev + 1;
      return nextValue > 5 ? 1 : nextValue;
    });
  };

  const Mock = isImg ? carouselImgMock : carouselTextMock;

  const { data: safeData, isValid } = useValidationData(
    Mock,
    CarouselSlideDataSchema,
    fallback,
  );
  const { t, i18n } = useLocalization();

  const localizedData = useLocalizedData(safeData, ["content"], "dataCarousel");

  return (
    <main className={appStyles.app}>
      <section className={appStyles.page}>
        <div className={appStyles.header}>
          <div className={appStyles.settings}>
            <button className={appStyles.button} onClick={toggleTheme}>
              {t("app:сhange_theme")}
            </button>
            <button className={appStyles.button} onClick={toggleLanguage}>
              {t("app:сhange_lang")}
            </button>
          </div>
          <div className={appStyles.controls}>
            <button
              className={appStyles.button}
              onClick={() => setIsAutoOn((prev) => !prev)}
            >
              {t("appCarousel:autoscroll", {
                context: isAutoOn ? "on" : "off",
              })}
            </button>
            <button
              className={appStyles.button}
              onClick={() => setIsPaginated((prev) => !prev)}
            >
              {t("appCarousel:pagination", {
                context: isPaginated ? "on" : "off",
              })}
            </button>
            <button
              className={appStyles.button}
              onClick={() => setIsInteractive((prev) => !prev)}
            >
              {t("appCarousel:interactive", {
                context: isInteractive ? "on" : "off",
              })}
            </button>
            <button
              className={appStyles.button}
              onClick={() => setIsImg((prev) => !prev)}
            >
              {t("appCarousel:dataType", {
                context: isImg ? "img" : "text",
              })}
            </button>
            <button className={appStyles.button} onClick={toggleVisibleSlides}>
              {t("appCarousel:slideNr")} {visibleSlides}
            </button>
            <button
              className={appStyles.button}
              onClick={() => setIsInfinite((prev) => !prev)}
            >
              {t("appCarousel:infiniteStatus", {
                val: isInfinite ? t("appCarousel:yes") : t("appCarousel:no"),
              })}
            </button>
            <button
              className={appStyles.button}
              onClick={() => setIsReducedMotion((prev) => !prev)}
            >
              {t("appCarousel:red.motion", {
                val: isReducedMotion
                  ? t("appCarousel:yes")
                  : t("appCarousel:no"),
              })}
            </button>
          </div>
          <div className={appStyles.status}>
            <div
              className={clsx(
                appStyles.statusSection,
                !isValid && appStyles.error,
              )}
            >
              {t("app:validation", {
                context: isValid ? "valid" : "invalid",
              })}
            </div>
            <div className={appStyles.statusSection}>
              {t("app:theme_label", {
                val: t(`app:themes.${theme}`),
              })}
            </div>

            <div className={appStyles.statusSection}>
              {t("app:lang_label", {
                val: t(`app:lang.${i18n.language}`),
              })}
            </div>
            <div className={appStyles.statusSection}>
              {t("app:pointer_label", {
                val: isTouch ? t("app:touch") : t("app:mouse"),
              })}
            </div>
          </div>
        </div>

        <div className={appStyles.component}>
          <CarouselMulti
            visibleSlides={visibleSlides}
            className={custom_styles}
            slides={localizedData}
            isAuto={isAutoOn}
            isImg={isImg && isValid}
            ErrAltPlaceholder="ОШИБКА ! :("
            isPaginated={isPaginated}
            isPaginationDynamic={true}
            isInteractive={isInteractive && isValid}
            speedAutoBase={4000}
            speedManualStep={2000}
            speedManualJump={800}
            delayAuto={3000}
            isInfinite={isInfinite}
            isReducedMotionProp={isReducedMotion}
            isTouchProp={isTouch}
            onSlideClick={handleSlideClick}
          />
        </div>
      </section>
      <section className={appStyles.page}></section>
    </main>
  );
}
export default App;
