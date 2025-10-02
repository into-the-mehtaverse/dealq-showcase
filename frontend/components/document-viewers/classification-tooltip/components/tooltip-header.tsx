import React from 'react';
import { Building } from 'lucide-react';

interface TooltipHeaderProps {
  title?: string;
  description?: string;
}

export default function TooltipHeader({
  title = "AI Classification Results",
  description = "Jump to any page with a click"
}: TooltipHeaderProps) {
  return (
    <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
      <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
        <Building className="w-4 h-4" />
        {title}
      </h4>
      <p className="text-xs text-blue-700 mt-1">
        {description}
      </p>
    </div>
  );
}
