import { v4 as uuidv4 } from "uuid";
import { isDev, checkStructure, checkIDs, type DataRecord } from "./guards";

const formatValue = (value: unknown) =>
  typeof value === "number" && Number.isNaN(value) ? "NaN" : String(value);

export function resolveStructure<T extends string>(
  rawData: unknown,
  key: T,
): DataRecord[] {
  const context = "Resolve Structure";

  const isInvalid = (val: unknown) =>
    val === null ||
    val === undefined ||
    typeof val === "boolean" ||
    typeof val === "symbol" ||
    typeof val === "function" ||
    (typeof val === "number" && !Number.isFinite(val));

  if (isInvalid(rawData)) {
    if (isDev) {
      const display = formatValue(rawData);
      console.warn(`⚠️ ${context}: Incompatible data type: ${display}`);
      console.error(
        `❌ ${context}: Normalization failed, returned an empty array.`,
      );
    }
    return [];
  }

  if (Array.isArray(rawData)) {
    const result: DataRecord[] = [];
    let primitivesCount = 0;

    for (const item of rawData) {
      if (isInvalid(item)) {
        if (isDev) {
          const display = formatValue(item);
          console.warn(
            `⚠️ ${context}: Array contains invalid element: ${display}`,
          );
          console.error(
            `❌ ${context}: Normalization failed, returned an empty array.`,
          );
        }
        return [];
      }

      if (item !== null && typeof item === "object" && !Array.isArray(item)) {
        if (key in item) {
          result.push(item as DataRecord);
        } else {
          if (isDev) {
            console.warn(
              `⚠️ ${context}: Object in array missing key: "${key}"`,
            );
            console.error(
              `❌ ${context}: Normalization failed, returned an empty array.`,
            );
          }
          return [];
        }
      } else {
        result.push({ [key]: item });
        primitivesCount++;
      }
    }

    if (isDev) {
      if (primitivesCount > 0) {
        console.warn(
          `⚠️ ${context}: Array contains ${primitivesCount} primitives.`,
        );
        console.info(
          `ℹ️ ${context} FIX: Primitives normalized with key "${key}".`,
        );
      } else {
        console.log(
          `✅ ${context}: Normalization is not needed, returned the original array.`,
        );
      }
    }

    return primitivesCount === 0 ? (rawData as DataRecord[]) : result;
  }

  if (typeof rawData === "object") {
    if (key in (rawData as object)) {
      if (isDev) {
        console.warn(`⚠️ ${context}: Received single object. Expected Array.`);
        console.info(`ℹ️ ${context} FIX: Object wrapped with Array.`);
      }
      return [rawData as DataRecord];
    }
    if (isDev) {
      console.warn(`⚠️ ${context}: Single object missing key: "${key}".`);
      console.error(
        `❌ ${context}: Normalization failed, returned an empty array.`,
      );
    }
    return [];
  }

  if (isDev) {
    console.warn(`⚠️ ${context}: Received primitive value: "${rawData}".`);
    console.info(
      `ℹ️ ${context} FIX: Value wrapped with key "${key}" and Array.`,
    );
  }
  return [{ [key]: rawData }];
}

export function resolveID(data: unknown): DataRecord[] {
  const context = "Resolve ID";

  if (!checkStructure(data, context)) {
    if (isDev) {
      console.error(
        `❌ ${context}: Normalization failed, returned an empty array.`,
      );
    }
    return [];
  }

  const structuredData = data as DataRecord[];

  if (checkIDs(structuredData, context)) {
    if (isDev) {
      console.log(
        `✅ ${context}: Normalization is not needed, returned the original array.`,
      );
    }
    return structuredData;
  }

  if (isDev) console.info(`ℹ️ ${context} FIX: Resetting all IDs to UUIDv4.`);

  return structuredData.map((item) => ({
    ...item,
    id: uuidv4(),
  }));
}
