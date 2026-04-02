type RequiredStyles<T extends Record<string, string>> = {
  [K in keyof T]-?: string;
};

export const mergeStyles = <T extends Record<string, string>>(
  ...styles: (Partial<T> | undefined)[]
): RequiredStyles<T> => {
  const result: Partial<T> = {};

  for (const styleObj of styles) {
    if (!styleObj) continue;

    (Object.keys(styleObj) as (keyof T)[]).forEach((key) => {
      const value = styleObj[key];
      if (value) {
        result[key] = value;
      }
    });
  }

  return result as RequiredStyles<T>;
};
