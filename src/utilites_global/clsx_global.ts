export const mergeBaseStyles = <T extends Record<string, string>>(
  defaultStyles: T,
  className?: Partial<T>,
): T => {
  const base = {} as T;

  (Object.keys(defaultStyles) as (keyof T)[]).forEach((key) => {
    base[key] = className?.[key] ?? defaultStyles[key];
  });

  return base;
};
