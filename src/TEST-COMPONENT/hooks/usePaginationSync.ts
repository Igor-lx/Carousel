import type { MoveReason } from "../model/reducer";

interface UsePaginationSyncProps {
  targetIndex: number;
  duration: number;
  moveReason: MoveReason;
  isInstant: boolean;
}

export const usePaginationSync = ({
  targetIndex,
}: UsePaginationSyncProps) => targetIndex;
