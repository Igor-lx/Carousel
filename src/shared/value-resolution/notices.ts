import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

export interface DevNoticeEntry {
  field: string;
  provided?: unknown;
  normalized?: unknown;
  reason?: string;
  message?: string;
  unit?: string;
}

export type DevNoticeReporter = (entries: DevNoticeEntry[]) => void;

interface UseGroupedDevNoticeProps {
  scope: string;
  summary: string;
  entries: DevNoticeEntry[];
}

export const formatNoticeValue = (value: unknown) => {
  if (typeof value === "number") {
    if (Number.isNaN(value)) return "NaN";
    if (value === Number.POSITIVE_INFINITY) return "Infinity";
    if (value === Number.NEGATIVE_INFINITY) return "-Infinity";
    return String(value);
  }

  if (typeof value === "string") {
    return `"${value}"`;
  }

  if (typeof value === "undefined") {
    return "undefined";
  }

  if (value === null) {
    return "null";
  }

  try {
    const json = JSON.stringify(value);

    return json ?? String(value);
  } catch {
    return String(value);
  }
};

export const getNoticeEntrySignature = (entry: DevNoticeEntry) =>
  [
    entry.field,
    formatNoticeEntryValue(entry.provided, entry.unit),
    formatNoticeEntryValue(entry.normalized, entry.unit),
    entry.reason ?? "",
    entry.message ?? "",
    entry.unit ?? "",
  ].join("|");

const formatNoticeEntryValue = (value: unknown, unit?: string) => {
  const formattedValue = formatNoticeValue(value);

  if (!unit || typeof value !== "number" || !Number.isFinite(value)) {
    return formattedValue;
  }

  return `${formattedValue}${unit}`;
};

export const formatNoticeEntry = (entry: DevNoticeEntry) => {
  if (entry.message) {
    return `- ${entry.field}: ${entry.message}`;
  }

  const transition =
    `${formatNoticeEntryValue(entry.provided, entry.unit)} -> ` +
    `${formatNoticeEntryValue(entry.normalized, entry.unit)}`;

  if (entry.reason) {
    return `- ${entry.field}: ${transition} (${entry.reason})`;
  }

  return `- ${entry.field}: ${transition}`;
};

const publishGroupedDevNotice = ({
  scope,
  summary,
  entries,
  previousSignatureRef,
}: UseGroupedDevNoticeProps & {
  previousSignatureRef: MutableRefObject<string>;
}) => {
  if (!import.meta.env.DEV) {
    return;
  }

  if (entries.length === 0) {
    previousSignatureRef.current = "";
    return;
  }

  const signature = entries.map(getNoticeEntrySignature).join("\n");

  if (signature === previousSignatureRef.current) {
    return;
  }

  previousSignatureRef.current = signature;

  console.warn(`[${scope}] ${summary}\n${entries.map(formatNoticeEntry).join("\n")}`);
};

export function useGroupedDevNotice({
  scope,
  summary,
  entries,
}: UseGroupedDevNoticeProps): void {
  const previousSignatureRef = useRef("");

  useEffect(() => {
    publishGroupedDevNotice({
      scope,
      summary,
      entries,
      previousSignatureRef,
    });
  }, [entries, scope, summary]);
}

export function useGroupedDevNoticeReporter({
  scope,
  summary,
}: Omit<UseGroupedDevNoticeProps, "entries">): DevNoticeReporter {
  const previousSignatureRef = useRef("");

  return useCallback(
    (entries) => {
      publishGroupedDevNotice({
        scope,
        summary,
        entries,
        previousSignatureRef,
      });
    },
    [scope, summary],
  );
}
