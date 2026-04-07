export function mergeStyles<T extends Record<string, string>>(
  ...styles: (Partial<T> | null | undefined)[]
): T {
  const result = {} as Record<string, string>;

  styles.forEach((styleObj) => {
    if (!styleObj) return;

    for (const key in styleObj) {
      const value = styleObj[key];
      if (!value) continue;

      if (result[key]) {
        result[key] = `${result[key]} ${value}`;
      } else {
        result[key] = value;
      }
    }
  });

  return result as T;
}
