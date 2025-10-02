"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Document, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { PdfDocument } from './pdf-document';
import { PdfControls } from './pdf-controls';
import { PdfGestureHandler } from './pdf-gesture-handler';
import { usePdfViewport } from './hooks/use-pdf-viewport';

// Set up PDF.js worker to use CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  documentName?: string;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  className?: string;
  pdfUrl?: string;
  onPageClick?: (pageNumber: number) => void;
  highlightedPages?: number[];
  tooltip?: React.ReactNode;
}

export default function PdfViewer({
  totalPages = 25,
  currentPage = 1,
  onPageChange,
  isLoading = false,
  className = "",
  pdfUrl,
  onPageClick,
  highlightedPages = [],
  tooltip
}: PdfViewerProps) {
  const [internalCurrentPage, setInternalCurrentPage] = useState(currentPage);
  const [numPages, setNumPages] = useState<number>(totalPages);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pageInputValue, setPageInputValue] = useState(currentPage.toString());
  const [isActive, setIsActive] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const {
    zoom,
    pan,
    resetView,
    zoomIn,
    zoomOut,
    setZoom,
    setPan
  } = usePdfViewport();

  const activePage = onPageChange ? currentPage : internalCurrentPage;

  // Update input value when activePage changes
  useEffect(() => {
    setPageInputValue(activePage.toString());
  }, [activePage]);

  // Handle escape key to deactivate
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActive) {
        setIsActive(false);
      }
    };

    if (isActive) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isActive]);

  // Handle clicks outside PDF content to deactivate
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isActive && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsActive(false);
      }
    };

    if (isActive) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isActive]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > numPages) return;

    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalCurrentPage(newPage);
    }
  }, [numPages, onPageChange]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPdfLoading(false);
    setPdfError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF loading error:', error);
    setPdfError('Failed to load PDF document');
    setPdfLoading(false);
  }, []);

  const handlePageClick = useCallback((pageNumber: number) => {
    if (onPageClick) {
      onPageClick(pageNumber);
    }
  }, [onPageClick]);

  // Handle activation when clicking on PDF content
  const handlePdfContentClick = useCallback(() => {
    setIsActive(true);
  }, []);

  // Handle deactivation when clicking on controls
  const handleControlsClick = useCallback(() => {
    setIsActive(false);
  }, []);

  return (
    <Card
      ref={containerRef}
      className={`pb-1 pt-4 flex flex-col h-full ${className} ${isActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
    >
      {/* Zoom Controls */}
      <PdfControls
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetView}
        onClick={handleControlsClick}
        tooltip={tooltip}
      />

      {/* PDF Content Area with Gesture Handling */}
      <div className="flex-1 bg-slate-50 min-h-0 relative">
        {!isActive && !isLoading && !pdfLoading && !pdfError && pdfUrl && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm border border-slate-200">
              <p className="text-sm text-slate-600">Click to enable zoom & pan</p>
            </div>
          </div>
        )}
        <PdfGestureHandler
          zoom={zoom}
          pan={pan}
          onZoomChange={setZoom}
          onPanChange={setPan}
          containerRef={containerRef}
          isActive={isActive}
        >
          <div className="h-full overflow-hidden" onClick={handlePdfContentClick}>
            {isLoading || pdfLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-slate-600">Loading document...</p>
                </div>
              </div>
            ) : pdfError ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-red-600 p-8">
                  <AlertTriangle className="w-10 h-10 mb-4" />
                  <h4 className="text-lg font-medium mb-2">Error Loading PDF</h4>
                  <p className="text-sm">{pdfError}</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-slate-600">Loading PDF...</p>
                  </div>
                }
              >
                <PdfDocument
                  pageNumber={activePage}
                  zoom={zoom}
                  pan={pan}
                />
              </Document>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-slate-400 p-8">
                  <div className="text-6xl mb-4">📄</div>
                  <h4 className="text-lg font-medium mb-2">No PDF Loaded</h4>
                  <p className="text-sm">
                    Source document will appear here during verification
                  </p>
                </div>
              </div>
            )}
          </div>
        </PdfGestureHandler>
      </div>

      {/* PDF Controls */}
      <div className="border-t border-slate-200 py-2 px-4">
        <div className="flex items-center justify-between">
          {/* Page Navigation */}
          <div className="flex items-center gap-1">
            <Button
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage <= 1 || isLoading || pdfLoading}
              variant="ghost"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1 text-sm">
              <span className="text-slate-600">Page</span>
              <input
                type="text"
                value={pageInputValue}
                onChange={(e) => {
                  setPageInputValue(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const page = parseInt((e.target as HTMLInputElement).value);
                    if (!isNaN(page) && page >= 1 && page <= numPages) {
                      handlePageChange(page);
                    } else {
                      setPageInputValue(activePage.toString());
                    }
                  }
                }}
                onBlur={() => {
                  const page = parseInt(pageInputValue);
                  if (!isNaN(page) && page >= 1 && page <= numPages) {
                    handlePageChange(page);
                  } else {
                    setPageInputValue(activePage.toString());
                  }
                }}
                onClick={(e) => {
                  (e.target as HTMLInputElement).focus();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  (e.target as HTMLInputElement).focus();
                }}
                disabled={isLoading || pdfLoading}
                className="w-16 px-2 py-1 text-center rounded-md"
                placeholder={activePage.toString()}
                tabIndex={0}
              />
              <span className="text-slate-600">of {numPages}</span>
            </div>

            <Button
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage >= numPages || isLoading || pdfLoading}
              variant="ghost"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3 w-32">
            <Progress value={(activePage / numPages) * 100} className="h-1.5" />
          </div>

          {/* Highlighted Pages Indicator */}
          {highlightedPages.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
              <span>Highlighted pages:</span>
              <div className="flex gap-1">
                {highlightedPages.slice(0, 5).map((page) => (
                  <Button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    variant="outline"
                    size="sm"
                    className="h-6 px-2"
                  >
                    {page}
                  </Button>
                ))}
                {highlightedPages.length > 5 && (
                  <span className="text-slate-500">+{highlightedPages.length - 5} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
