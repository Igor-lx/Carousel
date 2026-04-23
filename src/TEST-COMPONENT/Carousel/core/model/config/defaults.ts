export const DEFAULT_SETTINGS = {
  visibleSlidesNr: 3, // кол-во слайдов на экране.
  durationAutoplay: 3000,
  intervalAutoplay: 3000,
  durationStep: 2000,
  durationJump: 800,
  errAltPlaceholder: "Downloading Error",
  isLayoutClamped: false, //при НЕкратно-делимом лэйауте - добавляет клоны первых слайдов в конец ленты.
  isContentImg: true, //содержимое слайда по умолчанию считается как IMG(true) / TEXT(false) => соответствующая ветка рендера.
  isAuto: true, // автоплей по дефолту on/off.
  isPaginationOn: true, // пагинация on/off.
  isControlsOn: true, // кнопки управления on/off.
  isInteractive: true, // делает слайд интерактивным и пробрасывает onSlideClick.
  isFinite: false, // бесконечный цикл прокрутки  on/off.
} as const;
