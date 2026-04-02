export interface PaginationClassMap {
  [key: string]: string | undefined;
  paginationWrapper?: string;
  dot?: string;
  dotActive?: string;
}

export type PaginationProps = {
  className?: PaginationClassMap;
};

export type PaginationDotProps = {
  idx: number;
  visualIndex: number;
  className: PaginationClassMap;
  onDotClick: (idx: number) => void;
};
