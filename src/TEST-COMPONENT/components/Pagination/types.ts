export interface PaginationClassMap {
  [key: string]: string | undefined;
  paginationWrapper?: string;
  dot?: string;
  dotActive?: string;
}

export interface PaginationProps {
  className?: PaginationClassMap;
};

export interface PaginationViewProps {
  pageCount: number;
  visualIndex: number;
  handleDotClick: (index: number) => void;
  styles: PaginationClassMap;
}

export interface PaginationDotProps {
  idx: number;
  visualIndex: number;
  onDotClick: (index: number) => void;
  styles: PaginationClassMap;
}
