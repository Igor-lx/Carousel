import { ZodType } from "zod";

const isDev = process.env.NODE_ENV === "development";

export type ValidatedState<T> = {
  data: T[];
  isValid: boolean;
};

export function isDataValid<T>(
  data: unknown[],
  schema: ZodType<T[]>,
): ValidatedState<T> {
  const result = schema.safeParse(data);
  const success = result.success && data.length > 0;

  if (isDev) {
    if (success) {
      console.log("✅ Data Validation: success.");
    } else {
      if (!result.success) {
        console.group("❌ Data Validation Failed: ZOD error.");
        result.error.issues.forEach((issue) => {
          const path =
            issue.path.length > 0
              ? ` at element [${issue.path.join(".")}]`
              : "";
          console.warn(`- ${issue.message}${path}`);
        });
        console.groupEnd();
      } else if (data.length === 0) {
        console.error("❌ Data Validation Failed: Received an empty array.");
      }
    }
  }

  return {
    data: success ? (data as T[]) : [],
    isValid: success,
  };
}

export function resolveWithFallback<T>(
  state: ValidatedState<T>,
  fallback: T,
): T[] {
  if (!state.isValid || state.data.length === 0) {
    if (isDev) console.info("ℹ️ Data Validation FIX: Fallback data used.");
    return [fallback];
  }

  return state.data;
}
