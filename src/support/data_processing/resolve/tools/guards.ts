export const isDev = process.env.NODE_ENV === "development";

export type DataRecord = Record<string, unknown>;

export function checkStructure(
  data: unknown,
  context?: string,
): data is DataRecord[] {
  const prefix = context ? `${context}->` : "";

  if (!Array.isArray(data)) {
    if (isDev) console.error(`❌ ${prefix}Check Structure: Is not an array.`);
    return false;
  }

  if (data.length === 0) {
    if (isDev) console.error(`❌ ${prefix}Check Structure: Array is empty.`);
    return false;
  }

  for (const item of data) {
    const isObject =
      item !== null && typeof item === "object" && !Array.isArray(item);
    if (!isObject) {
      if (isDev) {
        const type =
          item === null ? "null" : Array.isArray(item) ? "array" : typeof item;
        console.error(
          `❌ ${prefix}Check Structure: Non-object element found ("${type}").`,
        );
      }
      return false;
    }
  }

  if (isDev)
    console.log(`✅ ${prefix}Check Structure: Valid array of objects.`);
  return true;
}

export function checkIDs(
  data: DataRecord[],
  context?: string,
): boolean {
  const prefix = context ? `${context}->` : "";
  const ids = new Set<string | number>();

  for (const item of data) {
    const id = item.id;
    if (
      id === undefined ||
      id === null ||
      (typeof id === "string" && id.trim() === "")
    ) {
      if (isDev) console.warn(`⚠️ ${prefix}Check ID: Missing or empty ID.`);
      return false;
    }
    if (typeof id !== "string" && typeof id !== "number") {
      if (isDev)
        console.warn(
          `⚠️ ${prefix}Check ID: Invalid ID format ("${typeof id}").`,
        );
      return false;
    }
    if (ids.has(id)) {
      if (isDev)
        console.warn(`⚠️ ${prefix}Check ID: Duplicate ID found ("${id}").`);
      return false;
    }
    ids.add(id);
  }

  if (isDev && data.length > 0)
    console.log(`✅ ${prefix}Check ID: All ID's are valid.`);
  return true;
}
