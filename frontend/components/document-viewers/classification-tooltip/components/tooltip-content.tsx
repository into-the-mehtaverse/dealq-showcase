import React from 'react';
import { Building } from 'lucide-react';
import { ClassificationData } from '../types';
import FieldItem from './field-item';

interface TooltipContentProps {
  fieldEntries: Array<[string, ClassificationData]>;
  onPageClick: (pageNumber: number) => void;
}

export default function TooltipContent({ fieldEntries, onPageClick }: TooltipContentProps) {
  if (fieldEntries.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <Building className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No classification data available</p>
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto">
      <div className="p-0">
        {fieldEntries.map(([key, value]) => (
          <FieldItem
            key={key}
            fieldName={key}
            data={value}
            onPageClick={onPageClick}
          />
        ))}
      </div>
    </div>
  );
}
