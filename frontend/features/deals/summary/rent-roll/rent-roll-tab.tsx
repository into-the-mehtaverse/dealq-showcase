"use client";

import React from 'react';
import { DealSummary } from '@/types/property';
import { DocumentViewer } from '../shared';

interface RentRollTabProps {
  dealData: DealSummary;
  className?: string;
}

export default function RentRollTab({ dealData, className = '' }: RentRollTabProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Rent Roll</h2>
        <p className="text-sm text-gray-600 mt-1">
          View and analyze the property's rent roll data and tenant information.
        </p>
      </div>

      {/* Document Viewer */}
      <DocumentViewer
        fileUrl={dealData.rent_roll_file_url || ''}
        documentName="Rent Roll"
        className="w-full"
      />

      {/* Additional Rent Roll Information */}
      {dealData.rent_roll && dealData.rent_roll.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Rent Roll Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Units:</span>
              <span className="ml-2 font-medium">{dealData.number_of_units || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Records:</span>
              <span className="ml-2 font-medium">{dealData.rent_roll.length}</span>
            </div>
            <div>
              <span className="text-gray-600">Document Type:</span>
              <span className="ml-2 font-medium">
                {dealData.rent_roll_file_url ?
                  (dealData.rent_roll_file_url.toLowerCase().includes('.pdf') ? 'PDF' : 'Excel') :
                  'N/A'
                }
              </span>
            </div>
            <div>
              <span className="text-gray-600">Last Updated:</span>
              <span className="ml-2 font-medium">
                {dealData.updated_at ? new Date(dealData.updated_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
