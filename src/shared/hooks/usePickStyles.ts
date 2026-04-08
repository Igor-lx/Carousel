import { useMemo } from "react";

export function usePickStyles<T extends object, K extends keyof T>(
  source: T | undefined,
  keys: K[],
): Pick<T, K> {

  return useMemo(() => {
    const picked = {} as Pick<T, K>;

    if (!source || Object.keys(source).length === 0) {
      return picked;
    }

    keys.forEach((key) => {
      if (key in source) {
        (picked as any)[key] = source[key];
      }
    });

    return picked;
  }, [source, keys]);
}
