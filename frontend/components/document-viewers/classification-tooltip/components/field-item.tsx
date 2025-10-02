import React from 'react';
import { ChevronRight } from 'lucide-react';
import { FieldItemProps } from '../types';
import { getFieldIcon, getFieldIconColor } from '../utils';
import { formatFieldName, formatFieldValue } from '../utils';

export default function FieldItem({ fieldName, data, onPageClick }: FieldItemProps) {
  const handleClick = () => {
    onPageClick(data.first_page);
  };

  return (
    <button
      onClick={handleClick}
      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`${getFieldIconColor(fieldName)} group-hover:text-blue-700 flex-shrink-0`}>
            {getFieldIcon(fieldName)}
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="text-sm font-medium text-gray-900 truncate">
              {formatFieldName(fieldName)}
            </div>
            <div className="text-sm text-gray-600 truncate">
              {formatFieldValue(data.value, fieldName)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500">Page</span>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium text-blue-600 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
            {data.first_page}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>
    </button>
  );
}
