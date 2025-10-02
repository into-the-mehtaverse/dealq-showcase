"use client";

import React from 'react';
import { DealSummary } from '@/types/property';
import { DocumentViewer } from '../shared';

interface T12TabProps {
  dealData: DealSummary;
  className?: string;
}

export default function T12Tab({ dealData, className = '' }: T12TabProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">T-12 Financial Data</h2>
        <p className="text-sm text-gray-600 mt-1">
          View and analyze the property's trailing 12-month financial performance.
        </p>
      </div>

      {/* Document Viewer */}
      <DocumentViewer
        fileUrl={dealData.t12_file_url || ''}
        documentName="T-12 Financial Statement"
        className="w-full"
      />

      {/* Additional T12 Information */}
      {dealData.t12 && dealData.t12.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">T-12 Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Records:</span>
              <span className="ml-2 font-medium">{dealData.t12.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Revenue:</span>
              <span className="ml-2 font-medium">
                {dealData.revenue ? `$${dealData.revenue.toLocaleString()}` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Expenses:</span>
              <span className="ml-2 font-medium">
                {dealData.expenses ? `$${dealData.expenses.toLocaleString()}` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Document Type:</span>
              <span className="ml-2 font-medium">
                {dealData.t12_file_url ?
                  (dealData.t12_file_url.toLowerCase().includes('.pdf') ? 'PDF' : 'Excel') :
                  'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Financial Metrics Preview */}
      {(dealData.revenue || dealData.expenses) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-600 mb-1">Total Revenue</h4>
            <p className="text-2xl font-bold text-green-600">
              {dealData.revenue ? `$${dealData.revenue.toLocaleString()}` : 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-600 mb-1">Total Expenses</h4>
            <p className="text-2xl font-bold text-red-600">
              {dealData.expenses ? `$${dealData.expenses.toLocaleString()}` : 'N/A'}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-600 mb-1">Net Operating Income</h4>
            <p className="text-2xl font-bold text-blue-600">
              {dealData.revenue && dealData.expenses ?
                `$${(dealData.revenue - dealData.expenses).toLocaleString()}` :
                'N/A'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
