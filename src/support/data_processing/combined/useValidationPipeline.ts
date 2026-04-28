import type { ZodType } from "zod";
import { useMemo } from "react";
import { resolveStructure, resolveID } from "../resolve/tools/resolvers";
import { isDev } from "../resolve/useResolveStructure";
import {
  isDataValid,
  resolveWithFallback,
} from "../validation/tools/validation";

export function useValidationPipeline<
  T extends object,
  K extends string,
>(rawData: unknown, schema: ZodType<T[]>, key: K, fallback: T) {
  return useMemo(() => {
    const structured = resolveStructure(rawData, key);
    const finalized = resolveID(structured);

    if (isDev) {
      if (finalized === rawData && finalized.length > 0) {
        console.log(
          "✅ useResolveStructure: Structure is valid, returned the original array.",
        );
      } else if (finalized.length > 0) {
        const changedBy = [];
        if (structured !== rawData) changedBy.push("[Structure]");
        if (finalized !== structured) changedBy.push("[ID]");

        console.info(
          `✅ useResolveStructure FIX: Normalized by ${changedBy.join(" ")} and now valid.`,
        );
      } else {
        console.error(
          "❌ useResolveStructure: Normalization is not possible, returned an empty array.",
        );
      }
    }

    const validationState = isDataValid<T>(finalized, schema);

    const safeData = resolveWithFallback<T>(validationState, fallback);

    return {
      data: safeData,
      isValid: validationState.isValid,
    };
  }, [rawData, key, schema, fallback]);
}

/*

const MockData: MockType[] = [
  { id: "1", content: "content1" },
  { id: "2", content: "content2" },

];

const fallback: MockType = {
  id: "Fallback-ID",
  content: <p>DATA IS LOADING.... </p>,
};


  const { data: safeContent, isValid } = useValidationPipeline(
    MockData,
    MockDataSchema,
    "content",
    fallback,
  );

JSX:

<p>{isValid ? "Данные валидны" : "Данные не валидны"}</p>
 <Component
      className={styles}
      onClick={handleClick}
      content={SafeContent}
   
  />



*/
