"use client";

import { useState, useEffect, useMemo } from "react";
import { useVerificationSelectors, useVerificationActions } from "@/features/verification/store";
import ExcelViewer from "@/components/document-viewers/excel-viewer";
import PdfViewer from "@/components/document-viewers/pdf-viewer";

interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

type DocumentType = 'T12' | 'RR';

export default function RightSidebar({ isOpen, onToggle }: RightSidebarProps) {
  // Get sidebar state and actions from verification store
  const selectedDocument = useVerificationSelectors.useSelectedDocumentType();
  const { setSelectedDocumentType } = useVerificationActions();

  // Get deal response from verification store
  const dealResponse = useVerificationSelectors.useDealResponse();

  // Extract file URLs from deal response
  const fileUrls = useMemo(() => {
    if (!dealResponse) {
      return {
        omFileUrl: null,
        t12FileUrl: null,
        rentRollFileUrl: null,
        allFiles: [],
      };
    }

    return {
      omFileUrl: dealResponse.om_file_url || null,
      t12FileUrl: dealResponse.t12_file_url || null,
      rentRollFileUrl: dealResponse.rent_roll_file_url || null,
      allFiles: dealResponse.files || [],
    };
  }, [dealResponse]);

  // Cache for loaded Excel viewers to prevent reloading
  const [loadedViewers, setLoadedViewers] = useState<Set<string>>(new Set());

  // Get file info for the selected document type
  const selectedFileInfo = useMemo(() => {
    if (!selectedDocument || !fileUrls.allFiles.length) return null;

    return fileUrls.allFiles.find(file => file.document_type === selectedDocument);
  }, [selectedDocument, fileUrls.allFiles]);

  // Check if a file is an Excel file using file_type parameter
  const isExcelFile = (fileInfo: any): boolean => {
    if (!fileInfo) return false;
    return fileInfo.file_type === 'excel';
  };

  // Check if a file is a PDF file using file_type parameter
  const isPdfFile = (fileInfo: any): boolean => {
    if (!fileInfo) return false;
    return fileInfo.file_type === 'pdf';
  };

  // Get the file URL for the selected document type
  const selectedFileUrl = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Debug: Getting selected file URL for:', selectedDocument);
    }

    return selectedFileInfo?.file_url || null;
  }, [selectedDocument, selectedFileInfo]);

  // Get the display name for the selected document
  const getSelectedDocumentName = (): string => {
    if (selectedDocument === 'T12') {
      return 'T-12 Report';
    } else if (selectedDocument === 'RR') {
      return 'Rent Roll';
    }
    return '';
  };

  const handleDocumentSelect = (documentType: DocumentType) => {
    console.log('🔍 Debug: Document selected:', documentType);
    setSelectedDocumentType(documentType);
  };

  // Track when a viewer is loaded
  const handleViewerLoad = (fileUrl: string) => {
    console.log('🔍 Debug: Viewer loaded for:', fileUrl);
    setLoadedViewers(prev => new Set(prev).add(fileUrl));
  };

  // Track PDF viewer loads (since they don't have onLoad callback)
  useEffect(() => {
    if (selectedDocument && selectedFileUrl && isPdfFile(selectedFileInfo)) {
      // Add a small delay to simulate PDF loading completion
      const timer = setTimeout(() => {
        handleViewerLoad(selectedFileUrl);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [selectedDocument, selectedFileUrl, selectedFileInfo]);

  return (
    <div className="flex h-screen">
      {/* Right Sidebar */}
      <div className={`fixed right-0 top-0 h-full transition-all duration-300 ease-in-out ${
        isOpen ? 'w-[60%]' : 'w-8'
      } bg-sidebar shadow-lg border-l border-gray-200 z-50`}>

        {/* Collapsed State - Handle */}
        {!isOpen && (
          <div className="h-full flex items-center justify-center">
            <button
              onClick={onToggle}
              className="w-6 h-16 bg-gray-100 hover:bg-gray-200 rounded-l-lg flex items-center justify-center transition-colors duration-200 group"
              title="Open source documents"
            >
              <div className="flex flex-col space-y-1">
                <div className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-gray-700 transition-colors"></div>
                <div className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-gray-700 transition-colors"></div>
                <div className="w-1 h-1 bg-gray-500 rounded-full group-hover:bg-gray-700 transition-colors"></div>
              </div>
            </button>
          </div>
        )}

        {/* Expanded State - Content */}
        {isOpen && (
          <div className="h-full flex flex-col">

            {/* Document Type Toggles */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Select Document Type</h3>
              <button
                onClick={onToggle}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDocumentSelect('T12')}
                  className={`flex-1 p-3 text-left rounded-lg border transition-all duration-200 ${
                    selectedDocument === 'T12'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">T-12 Report</span>
                    {fileUrls.t12FileUrl && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Available
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => handleDocumentSelect('RR')}
                  className={`flex-1 p-3 text-left rounded-lg border transition-all duration-200 ${
                    selectedDocument === 'RR'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Rent Roll</span>
                    {fileUrls.rentRollFileUrl && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Available
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Document Viewer */}
            <div className="flex-1 p-4">
              {selectedDocument ? (
                <div className="h-full flex flex-col">
                  {selectedFileUrl ? (
                    isExcelFile(selectedFileInfo) ? (
                      <div className="h-full flex flex-col">
                        <ExcelViewer
                          fileUrl={selectedFileUrl!}
                          fileName={getSelectedDocumentName()}
                          height="60vh"
                          showToolbar={false}
                          allowEditing={false}
                          onLoad={() => handleViewerLoad(selectedFileUrl!)}
                          onError={(error) => console.error('Excel loading error:', error)}
                          key={selectedFileUrl} // Use file URL as key for proper caching
                        />
                      </div>
                    ) : isPdfFile(selectedFileInfo) ? (
                      <div className="h-[calc(100vh-175px)] flex flex-col">
                        <PdfViewer
                          pdfUrl={selectedFileUrl!}
                          documentName={getSelectedDocumentName()}
                          key={selectedFileUrl} // Use file URL as key for proper caching
                        />
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Unsupported File Format</h3>
                          <p className="text-sm text-gray-600 max-w-xs">
                            This document format is not supported. Only Excel (.xlsx, .xls) and PDF (.pdf) files can be displayed in the viewer.
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Selected</h3>
                        <p className="text-sm text-gray-600">
                          Select a document type above to view the file.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Document</h3>
                    <p className="text-sm text-gray-600">
                      Choose T-12 or Rent Roll to view the corresponding file.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
