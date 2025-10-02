import React from 'react';
import { PageButtonProps } from '../types';

export default function PageButton({
  pageNumber,
  onClick,
  variant = 'primary',
  className = ''
}: PageButtonProps) {
  const baseClasses = "px-2 py-1 text-xs rounded hover:transition-colors transition-colors";

  const variantClasses = {
    primary: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200"
  };

  return (
    <button
      onClick={() => onClick(pageNumber)}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      title={`Go to page ${pageNumber}`}
    >
      {pageNumber}
    </button>
  );
}
