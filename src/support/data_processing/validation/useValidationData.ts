import { useMemo } from "react";
import type { ZodType } from "zod";
import { isDataValid, resolveWithFallback } from "./tools/validation";

export function useValidationData<T extends Record<string, any>>(
  rawData: any[],
  schema: ZodType<T[]>,
  fallback: T,
) {
  return useMemo(() => {
    const validationState = isDataValid<T>(rawData, schema);
    const safeData = resolveWithFallback<T>(validationState, fallback);

    return {
      data: safeData,
      isValid: validationState.isValid,
    };
  }, [rawData, schema, fallback]);
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


  const { data: SafeContent, isValid } = useValidationData(
    MockData,
    MockDataSchema,
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
