const FOCUSABLE_ELEMENTS_SELECTOR = `
  button:not([disabled]),
  [href],
  input:not([disabled]),
  select:not([disabled]),
  textarea:not([disabled]),
  [tabindex]:not([tabindex="-1"])
`.trim();

export const manageFocusShift = (container: HTMLElement | null): void => {
  if (!container) return;
  const activeEl = document.activeElement as HTMLElement | null;
  if (!activeEl || !container.contains(activeEl)) return;

  const slideEl = activeEl.closest<HTMLElement>("[data-active-zone]");

  if (!slideEl) return;

  if (slideEl?.dataset.activeZone === "true" && !activeEl.closest("[inert]")) {
    return;
  }

  const activeZone = container.querySelector<HTMLElement>(
    '[data-active-zone="true"]:not([inert])',
  );

  if (!activeZone) {
    container.focus({ preventScroll: true });
    return;
  }

  const toFocus = activeZone.matches(FOCUSABLE_ELEMENTS_SELECTOR)
    ? activeZone
    : activeZone.querySelector<HTMLElement>(FOCUSABLE_ELEMENTS_SELECTOR);

  (toFocus ?? container).focus({ preventScroll: true });
};

/*

    useEffect(() => {
      manageFocusShift(containerRef.current);
    }, [trigger-flag]);


1. const containerRef = useRef(null) // контейнер внутри которого следим за потерей фокуса
2. data-active-zone={true}           //  контейнер внутрь которого переводим фокус

                                     //  data-active-zone должен быть вложенным в containerRef

                                     // если внутри containerRef "исчез" фокус (элемент удален из DOM, пришел пропс с ARIA inert/hidden) - то фокус далее скачет не абы куда,
                                     // а ищет контейнер (внутри  того же  containerRef) у которого  data-active-zone={true},
                                     // и переносит фокус на первый активный элемент этого контейнера.  


Проверка 1: Фокус был внутри containerRef? — Да.
Проверка 2: Элемент под фокусом стал инвалидом (inert/hidden)? — Да.
Результат: Фокус сейчас вылетит из контейнера на body,  ищем data-active-zone={true} внутри нашего containerRef и переносим фокус туда.

*/
