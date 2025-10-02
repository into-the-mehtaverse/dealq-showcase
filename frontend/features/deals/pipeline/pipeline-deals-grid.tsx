"use client";

import { DealSummary } from "@/types/api/dealSummary";
import DealCardDetailed from "@/features/deals/shared/deal-card-detailed";
import PipelinePagination from "./pipeline-pagination";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePipelineStore,
  selectSelectedDealIds,
  selectHasSelection
} from "./store";

interface PipelineDealsGridProps {
  deals: DealSummary[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPageChange: (page: number) => void;
  className?: string;
  isSelectionMode?: boolean;
}

export default function PipelineDealsGrid({
  deals,
  loading,
  error,
  currentPage,
  totalPages,
  totalCount,
  hasNext,
  hasPrevious,
  onPageChange,
  className = "",
  isSelectionMode = false,
}: PipelineDealsGridProps) {
  // Store state for selection
  const selectedDealIds = usePipelineStore(selectSelectedDealIds);
  const hasSelection = usePipelineStore(selectHasSelection);

  // Store actions
  const { toggleSelection } = usePipelineStore();

  const handleSelectionChange = (dealId: string, selected: boolean) => {
    toggleSelection(dealId);
  };
  if (loading) {
    return (
      <Card className={`bg-background border-0 shadow-none ${className}`}>
        <CardHeader className="pb-0 -mb-2 flex justify-between">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] w-full rounded-t-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-background border-0 shadow-none ${className}`}>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Deals</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Try Again
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (deals.length === 0) {
    return (
      <Card className={`bg-background border-0 shadow-none ${className}`}>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">No Deals Found</h3>
            <p className="text-muted-foreground">
              There are no deals in this status. Try selecting a different tab or check back later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-background border-0 shadow-none ${className}`}>
      <CardHeader className="pb-0 -mb-2 flex justify-between">
        <h2 className="text-lg font-semibold text-slate-700 tracking-wide">
          DEALS:
        </h2>
      </CardHeader>

      <CardContent>
        {/* Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {deals.map((deal) => (
            <DealCardDetailed
              key={deal.id}
              deal={deal}
              isSelectionMode={isSelectionMode}
              isSelected={selectedDealIds.includes(deal.id)}
              onSelectionChange={handleSelectionChange}
            />
          ))}
        </div>

        {/* Pagination */}
        <PipelinePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          hasNext={hasNext}
          hasPrevious={hasPrevious}
          onPageChange={onPageChange}
        />
      </CardContent>
    </Card>
  );
}
