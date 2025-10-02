"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/card';
import { AlertTriangle, FileText } from 'lucide-react';

// Dynamic import with SSR disabled for PdfViewer since it uses browser APIs
const PdfViewer = dynamic(() => import('@/components/document-viewers/pdf-viewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-600">Loading PDF viewer...</p>
      </div>
    </div>
  )
});

// Dynamic import with SSR disabled for ExcelViewer since it uses iframe and browser APIs
const ExcelViewer = dynamic(() => import('@/components/document-viewers/excel-viewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-600">Loading Excel viewer...</p>
      </div>
    </div>
  )
});

interface DocumentViewerProps {
  fileUrl: string | undefined | null;
  documentName: string;
  className?: string;
}

export default function DocumentViewer({ fileUrl, documentName, className = '' }: DocumentViewerProps) {
  // Helper function to get file extension from URL
  const getFileExtension = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const extension = pathname.split('.').pop();
      return extension || '';
    } catch {
      return '';
    }
  };

  // Helper function to determine if file is PDF
  const isPdfFile = (url: string): boolean => {
    const extension = getFileExtension(url);
    return extension === 'pdf';
  };

  // Helper function to determine if file is Excel
  const isExcelFile = (url: string): boolean => {
    const extension = getFileExtension(url);
    const excelExtensions = ['xlsx', 'xls', 'xlsm', 'xlsb'];
    return excelExtensions.includes(extension);
  };

  // Check if file URL is valid
  const isValidFileUrl = (url: string | undefined | null): boolean => {
    return Boolean(url && url.trim() !== '' && (isPdfFile(url) || isExcelFile(url)));
  };

  // If no valid file URL, show placeholder
  if (!isValidFileUrl(fileUrl)) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {documentName} Available
            </h3>
            <p className="text-sm text-gray-600 max-w-xs">
              {documentName} document has not been uploaded yet.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Render appropriate viewer based on file type
  if (fileUrl && isPdfFile(fileUrl)) {
    return (
      <Card className={className}>
        <PdfViewer
          pdfUrl={fileUrl}
          documentName={documentName}
          className="h-[600px]"
        />
      </Card>
    );
  }

  if (fileUrl && isExcelFile(fileUrl)) {
    return (
      <Card className={className}>
        <ExcelViewer
          fileUrl={fileUrl}
          fileName={documentName}
          height="600px"
          className="h-[600px]"
        />
      </Card>
    );
  }

  // Fallback for unsupported file types
  return (
    <Card className={`p-8 ${className}`}>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unsupported File Format
          </h3>
          <p className="text-sm text-gray-600 max-w-xs">
            The {documentName} file format is not supported. Please upload a PDF or Excel file.
          </p>
        </div>
      </div>
    </Card>
  );
}
