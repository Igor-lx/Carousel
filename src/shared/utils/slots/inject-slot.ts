export function injectSlot<T extends object, S extends string>(
  Component: T,
  slotValue: S,
): T & { slot: S } {
  return Object.assign(Component, { slot: slotValue });
}
