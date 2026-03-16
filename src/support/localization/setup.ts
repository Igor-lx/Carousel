import { allJson } from "./translations_import";
export type LangMode = (typeof LANG_MODES)[keyof typeof LANG_MODES];

export const LANG_MODES = {
  RU: "ru",
  EN: "en",
} as const;

export const DEFAULT_LANG = LANG_MODES.RU;

export const NAMESPACES = ["app", "appCarousel", "dataCarousel"];

export const resources = {
  [LANG_MODES.RU]: {
    app: allJson.appRu,
    appCarousel: allJson.appCarouselRu,
    dataCarousel: allJson.dataCarouselRu,
  },
  [LANG_MODES.EN]: {
    app: allJson.appEn,
    appCarousel: allJson.appCarouselEn,
    dataCarousel: allJson.dataCarouselEn,
  },
} as const;

//export const NAMESPACES = Object.keys(resources[LANG_MODES.RU]);

//--------------------------------------------------------------------------------------------------------------------------------
/*

function App() {  


const { t, i18n } = useLocalization();  

  const localizedContent = useLocalizedData(
    rawDataArray,
    ["translationField1", "translationField2" ],
    "nameSpace",
  );


 return (
<button onClick={toggleLanguage}></button>
<button onClick={() => setLanguage(LANG_MODES.RU)}></button>

<p>{t("test")}</p>
<p>текущий язык : {i18n.language}</p>

<Component
    className={custom_styles}
    content={localizedContent}

*/
