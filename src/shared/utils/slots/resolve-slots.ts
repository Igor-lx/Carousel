import { Children, isValidElement, type ReactNode } from "react";

interface UnknownSlotted {
  slot?: string;
}


export function resolveSlots<T extends string>(
  children: ReactNode,
  slots: readonly T[],
): Record<T, ReactNode> {
  const result = Object.create(null) as Record<T, ReactNode>;
  for (const key of slots) result[key] = null;

  const slotSet = new Set<T>(slots);

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;


    const slotName = (child.type as UnknownSlotted).slot;


    if (!slotName) return;

    if (import.meta.env.DEV) {
      if (!slotSet.has(slotName as T)) {
        console.warn(
          `[ExtractSlots]: Unknown slot detected: "${slotName}". ` +
            `Expected one of: [${slots.join(", ")}]. ` +
            `This component will be ignored.`,
        );
        return; 
      }
    }

 
    const validSlotName = slotName as T;


    if (import.meta.env.DEV) {
      if (result[validSlotName]) {
        console.warn(
          `[ExtractSlots]: Duplicate slot detected: "${validSlotName}"`,
        );
      }
    }

    result[validSlotName] = child;
  });

  return result;
}
