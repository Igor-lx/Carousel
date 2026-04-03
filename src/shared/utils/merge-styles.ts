/*
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
*/

type MergedStyles<T extends Record<string, string>> = {
  [K in keyof T]: string;
};

export function mergeStyles<T extends Record<string, string>>(
  ...styles: (Partial<T> | null | undefined)[]
): MergedStyles<T> {
  const result = Object.create(null) as Record<string, string>;

  const hasOwn = Object.prototype.hasOwnProperty;

  for (let i = 0; i < styles.length; i++) {
    const styleObj = styles[i];

    if (styleObj == null) continue;

    for (const key in styleObj) {
      if (hasOwn.call(styleObj, key)) {
        const value = styleObj[key];

        if (value !== undefined && value !== null) {
          result[key] = value;
        }
      }
    }
  }

  return result as MergedStyles<T>;
}
