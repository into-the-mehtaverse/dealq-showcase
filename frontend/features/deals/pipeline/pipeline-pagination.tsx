"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PipelinePaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function PipelinePagination({
  currentPage,
  totalPages,
  totalCount,
  hasNext,
  hasPrevious,
  onPageChange,
  className = "",
}: PipelinePaginationProps) {
  // Don't render if there's only one page or no deals
  if (totalPages <= 1 || totalCount === 0) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show smart pagination with ellipsis
      if (currentPage <= 3) {
        // Near start: show 1, 2, 3, ..., last
        for (let i = 1; i <= 3; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near end: show 1, ..., last-2, last-1, last
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Middle: show 1, ..., current-1, current, current+1, ..., last
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {/* Results info */}
      <div className="text-sm text-muted-foreground">
        Showing {((currentPage - 1) * 12) + 1} to {Math.min(currentPage * 12, totalCount)} of {totalCount} deals
      </div>

      {/* Pagination controls */}
      <div className="flex items-center space-x-2">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!hasPrevious}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {renderPageNumbers().map((page, index) => (
            <div key={index}>
              {page === "..." ? (
                <span className="px-3 py-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page as number)}
                  className="min-w-[40px]"
                >
                  {page}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNext}
          className="flex items-center gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
