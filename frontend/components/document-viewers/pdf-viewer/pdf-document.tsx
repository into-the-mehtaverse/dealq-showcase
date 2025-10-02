"use client";

import { Page } from 'react-pdf';
import { useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface PdfDocumentProps {
  pageNumber: number;
  zoom: number;
  pan: { x: number; y: number };
}

export function PdfDocument({ pageNumber, zoom, pan }: PdfDocumentProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  // Calculate the transform for zoom and pan
  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

  // Handle page load to get dimensions
  const onPageLoadSuccess = (page: { width: number; height: number }) => {
    // Page dimensions are available if needed for future features
    console.log('Page loaded:', { width: page.width, height: page.height });
  };

  return (
    <div className="h-full flex items-center justify-center overflow-hidden">
      <div
        ref={pageRef}
        className="relative"
        style={{
          transform,
          transformOrigin: 'center center',
          transition: 'transform 0.1s ease-out'
        }}
      >
        <Page
          pageNumber={pageNumber}
          scale={1} // We handle scale via CSS transform instead
          onLoadSuccess={onPageLoadSuccess}
          loading={
            <div className="bg-white border border-slate-300 rounded-lg shadow-sm flex items-center justify-center h-[600px] w-[450px]">
              <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            </div>
          }
          error={
            <div className="bg-white border border-slate-300 rounded-lg shadow-sm flex items-center justify-center h-[600px] w-[450px]">
              <div className="text-center text-red-600">
                <AlertTriangle className="w-10 h-10 mb-2" />
                <p className="text-sm">Failed to load page</p>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
