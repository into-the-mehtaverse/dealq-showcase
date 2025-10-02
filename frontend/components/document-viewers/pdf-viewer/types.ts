export interface PanPosition {
  x: number;
  y: number;
}

export interface PdfViewerProps {
  documentName?: string;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  className?: string;
  pdfUrl?: string;
  onPageClick?: (pageNumber: number) => void;
  highlightedPages?: number[];
}

export interface PdfDocumentProps {
  pageNumber: number;
  zoom: number;
  pan: PanPosition;
}

export interface PdfControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export interface PdfGestureHandlerProps {
  children: React.ReactNode;
  zoom: number;
  pan: PanPosition;
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: PanPosition) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}
