import { useMemo } from "react";
import { resolveID, resolveStructure } from "./tools/resolvers";

export const isDev = process.env.NODE_ENV === "development";

export function useResolveStructure<T extends string>(
  rawData: unknown,
  key: T,
) {
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

    return finalized;
  }, [rawData, key]);
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


const structuredData = useResolveStructure(MockData, "content");

*/
