export const DEFAULT_SETTINGS = {
  visibleSlidesNr: 3, // кол-во видимых слайдов
  durationAutoplay: 3000, 
  intervalAutoplay: 3000, 
  durationStep: 2000, 
  durationJump: 800, 
  errAltPlaceholder: "Downloading Error", 
  isLayoutClamped: false, // При некратном layout добавляет клоны первых слайдов в хвост.
  isContentImg: true, // По умолчанию контент слайда считается IMG(true) / TEXT(false).
  isAuto: true, // Автоплей по умолчанию включен.
  isPaginationOn: true, // Пагинация по умолчанию включена.
  isControlsOn: true, // Кнопки управления по умолчанию включены.
  isInteractive: true, // Делает слайд интерактивным и пробрасывает onSlideClick.
  isFinite: false, // Включает конечную(false) или циклическую(true) ленту.
} as const;
