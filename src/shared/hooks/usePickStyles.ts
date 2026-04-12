import { useMemo } from "react";

export function usePickStyles<
  T extends Record<string, string>,
  K extends keyof T,
>(styles: T, keys: readonly K[]): Record<K, string> {
  return useMemo(() => {
    const result = {} as Record<K, string>;

    keys.forEach((key) => {
      result[key] = styles[key] || "";
    });

    return result;
  }, [styles, keys]);
}
