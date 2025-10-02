"use client";

import { useState, useEffect } from 'react';

interface ExcelViewerProps {
  fileUrl: string;
  fileName?: string;
  height?: string;
  width?: string;
  className?: string;
  showToolbar?: boolean;
  allowEditing?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export default function ExcelViewer({
  fileUrl,
  fileName = "Excel Document",
  height = "600px",
  width = "100%",
  className = "",
  showToolbar = true,
  allowEditing = false,
  onLoad,
  onError
}: ExcelViewerProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null
  });

  // Use fileUrl as the key to prevent unnecessary re-renders
  const [iframeKey, setIframeKey] = useState(fileUrl);

  // Generate Microsoft Office Online embed URL
  const generateOfficeEmbedUrl = (url: string): string => {
    // Microsoft Office Online embed format
    const encodedUrl = encodeURIComponent(url);
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setLoadingState({ isLoading: false, error: null });
    onLoad?.();
  };

  // Handle iframe error
  const handleIframeError = () => {
    const errorMessage = "Failed to load Excel file. Please check the file URL and try again.";
    setLoadingState({ isLoading: false, error: errorMessage });
    onError?.(errorMessage);
  };

  // Refresh the viewer
  const handleRefresh = () => {
    setLoadingState({ isLoading: true, error: null });
    // Force reload by changing the key
    setIframeKey(`${fileUrl}?refresh=${Date.now()}`);
  };

  // Validate file URL
  const isValidFileUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const validExtensions = ['.xlsx', '.xls', '.xlsm', '.xlsb'];
      const fileExtension = urlObj.pathname.toLowerCase().split('.').pop();
      return validExtensions.includes(`.${fileExtension}`);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!isValidFileUrl(fileUrl)) {
      const errorMessage = "Invalid file URL or unsupported file format. Please provide a valid Excel file URL.";
      setLoadingState({ isLoading: false, error: errorMessage });
      onError?.(errorMessage);
    }
  }, [fileUrl, onError]);

  // Update iframe key when fileUrl changes
  useEffect(() => {
    setIframeKey(fileUrl);
  }, [fileUrl]);

  const embedUrl = generateOfficeEmbedUrl(fileUrl);

  return (
    <div className={`excel-viewer ${className}`}>
      {/* Loading State */}
      {loadingState.isLoading && (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Loading Excel document...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {loadingState.error && (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center max-w-md">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load document</h3>
            <p className="text-sm text-gray-600 mb-4">{loadingState.error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Excel Viewer Iframe */}
      {!loadingState.error && (
        <div className="relative flex-1" style={{ height, width }}>
          <iframe
            key={iframeKey}
            src={embedUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className="border-0 min-h-0"
            title={`Excel Viewer - ${fileName}`}
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          />
        </div>
      )}

      {/* Footer with additional info */}
      {showToolbar && !loadingState.error && !loadingState.isLoading && (
        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Powered by Microsoft Office Online</span>
            <span>{allowEditing ? 'Editing enabled' : 'View only'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
