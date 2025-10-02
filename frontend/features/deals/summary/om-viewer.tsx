"use client";

import React, { useState } from 'react';
import { DealSummary } from '@/types/property';
import dynamic from 'next/dynamic';
import ClassificationTooltip from '@/components/document-viewers/classification-tooltip';
import { Sparkles } from 'lucide-react';

// Dynamic import with SSR disabled for PdfViewer since it uses browser APIs
const PdfViewer = dynamic(() => import('@/components/document-viewers/pdf-viewer/pdf-viewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-600">Loading PDF viewer...</p>
      </div>
    </div>
  )
});

interface OMViewerProps {
  dealData: DealSummary;
  className?: string;
}

export default function OMViewer({ dealData, className = '' }: OMViewerProps) {
  // Check if OM file URL exists
  const hasOMFile = dealData.om_file_url && dealData.om_file_url.trim() !== '';

  // State for current page in PDF viewer
  const [currentPage, setCurrentPage] = useState(1);

  // Handle page navigation from classification tooltip
  const handlePageNavigate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Create the classification tooltip component
  const classificationTooltip = dealData.om_classification ? (
    <ClassificationTooltip
      classification={dealData.om_classification}
      onPageNavigate={handlePageNavigate}
      trigger={
        <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          <Sparkles className="w-5 h-5 text-blue-600" />
        </button>
      }
    />
  ) : undefined;

  return (
    <div className={`h-full ${className}`}>
      {/* PDF Viewer or No Document State */}
      {hasOMFile ? (
        <div className="h-full max-h-[750px]">
          <PdfViewer
            pdfUrl={dealData.om_file_url}
            documentName="Offering Memorandum"
            className="h-full"
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            tooltip={classificationTooltip}
          />
        </div>
      ) : (
        <div className="h-full min-h-[500px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No OM Document Available
            </h3>
            <p className="text-sm text-gray-600 max-w-xs">
              The offering memorandum document has not been uploaded yet. Please check back later or contact the listing agent.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
