export function injectSlot<T, S extends string>(
  Component: T,
  slotValue: S,
): T & { slot: S } {
  const SlotComponent = Component as any;
  SlotComponent.slot = slotValue;

  return SlotComponent as T & { slot: S };
}
