export const mergeBaseStyles = <T extends Record<string, string>>(
  ...styles: (T | Partial<T> | undefined)[]
): T => {
  const result = {} as T;

  styles.forEach((styleObj) => {
    if (!styleObj) return;

    (Object.keys(styleObj) as (keyof T)[]).forEach((key) => {
      const value = styleObj[key];
      if (value) {
        result[key] = value as T[keyof T];
      }
    });
  });

  return result;
};
