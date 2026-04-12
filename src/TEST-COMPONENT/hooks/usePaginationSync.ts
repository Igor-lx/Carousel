import type { MoveReason } from "../model/reducer";

interface UsePaginationSyncProps {
  targetIndex: number;
  speed: number;
  conditions: MoveReason;
  isInstant: boolean;
}

export const usePaginationSync = ({
  targetIndex,
}: UsePaginationSyncProps) => targetIndex;
