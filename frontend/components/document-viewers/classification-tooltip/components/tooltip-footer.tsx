import React from 'react';
import PageButton from './page-button';

interface TooltipFooterProps {
  t12Pages: number[];
  rentRollPages: number[];
  onPageClick: (pageNumber: number) => void;
}

export default function TooltipFooter({ t12Pages, rentRollPages, onPageClick }: TooltipFooterProps) {
  if (t12Pages.length === 0 && rentRollPages.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
      <div className="flex gap-4 text-xs">
        {t12Pages.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">T-12:</span>
            <div className="flex gap-1">
              {t12Pages.slice(0, 3).map((page) => (
                <PageButton
                  key={page}
                  pageNumber={page}
                  onClick={onPageClick}
                  variant="primary"
                />
              ))}
              {t12Pages.length > 3 && (
                <span className="text-gray-500">+{t12Pages.length - 3}</span>
              )}
            </div>
          </div>
        )}
        {rentRollPages.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Rent Roll:</span>
            <div className="flex gap-1">
              {rentRollPages.slice(0, 3).map((page) => (
                <PageButton
                  key={page}
                  pageNumber={page}
                  onClick={onPageClick}
                  variant="secondary"
                />
              ))}
              {rentRollPages.length > 3 && (
                <span className="text-gray-500">+{rentRollPages.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
