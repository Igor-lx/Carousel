import { useTranslation } from "react-i18next";
import { useCallback, useMemo } from "react";
import { DEFAULT_NAMESPACE } from "./i18next";

export const localizeFields = <T extends object>(
  content: T[],
  contentKeys: Array<keyof T>,
  t: (key: string) => string,
): T[] => {
  return content.map((item) => {
    const localizedItem = { ...item } as Record<keyof T, unknown>;
    contentKeys.forEach((field) => {
      const value = item[field];
      if (typeof value === "string") {
        localizedItem[field] = t(value);
      }
    });
    return localizedItem as T;
  });
};

export const useLocalization = (nameSpace: string = DEFAULT_NAMESPACE) => {
  const { t, i18n } = useTranslation(nameSpace);

  const localize = useCallback(
    <T extends object>(content: T[], contentKeys: Array<keyof T>) => {
      return localizeFields(content, contentKeys, t);
    },
    [t],
  );

  return { localize, t, i18n };
};

export const useLocalizedData = <T extends object>(
  content: T[],
  contentKeys: Array<keyof T>,
  nameSpace: string = DEFAULT_NAMESPACE,
) => {
  const { localize } = useLocalization(nameSpace);

  return useMemo(() => {
    return localize(content, contentKeys);
  }, [content, contentKeys, localize]);
};
