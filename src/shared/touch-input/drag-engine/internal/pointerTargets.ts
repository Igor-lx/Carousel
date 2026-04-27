const INTERACTIVE_TARGET_SELECTOR = [
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "a[href]",
  "summary",
  "[contenteditable='true']",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='switch']",
  "[role='tab']",
  "[data-drag-ignore='true']",
].join(",");

export const getInteractiveTarget = (
  target: EventTarget | null,
  boundary: HTMLElement,
) => {
  if (!(target instanceof Element)) {
    return null;
  }

  const interactiveTarget = target.closest(INTERACTIVE_TARGET_SELECTOR);

  if (interactiveTarget === null || !boundary.contains(interactiveTarget)) {
    return null;
  }

  return interactiveTarget;
};
